import pytest
import pytest_asyncio
from app.core.settings import settings
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


REGISTER_PAYLOAD = {
    "email": "otp.test@active.com",
    "first_name": "Anna",
    "last_name": "Test",
    "password": "Password123",
}


async def _register(async_client: AsyncClient, email: str) -> None:
    payload = {**REGISTER_PAYLOAD, "email": email}
    response = await async_client.post("/auth/register", json=payload)
    assert response.status_code == 201


async def _verify(async_client: AsyncClient, email: str, code: str):
    return await async_client.post(
        "/auth/verify",
        json={"email": email, "code": code},
    )


@pytest_asyncio.fixture
async def setup_companies(db_session: AsyncSession):
    from app.models import Company

    active_company = Company(
        name="Active B2B",
        email_domain="active.com",
        is_active=True,
        nip="1111111111",
    )
    inactive_company = Company(
        name="Inactive B2B",
        email_domain="inactive.com",
        is_active=False,
        nip="2222222222",
    )

    db_session.add_all([active_company, inactive_company])
    await db_session.commit()

    return {"active": active_company, "inactive": inactive_company}


async def test_verify_email_assigns_active_company(
    async_client: AsyncClient,
    db_session: AsyncSession,
    setup_companies: dict,
    fixed_otp,
):
    email = "test@active.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 200
    assert "successfully verified" in response.json()["message"]

    from app.crud import user as user_crud

    user = await user_crud.get_user_by_email(db_session, email)
    assert user is not None
    assert user.is_verified is True
    assert user.company_id == setup_companies["active"].id


async def test_verify_email_ignores_inactive_company(
    async_client: AsyncClient,
    db_session: AsyncSession,
    setup_companies: dict,
    fixed_otp,
):
    email = "test@inactive.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 200

    from app.crud import user as user_crud

    user = await user_crud.get_user_by_email(db_session, email)
    assert user is not None
    assert user.is_verified is True
    assert user.company_id is None


async def test_verify_email_no_matching_company(
    async_client: AsyncClient,
    db_session: AsyncSession,
    fixed_otp,
):
    email = "client@random-domain.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 200

    from app.crud import user as user_crud

    user = await user_crud.get_user_by_email(db_session, email)
    assert user is not None
    assert user.is_verified is True
    assert user.company_id is None


async def test_verify_email_wrong_code_increments_attempts(
    async_client: AsyncClient,
    fixed_otp,
):
    email = "wrong.code@example.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, "000001")
    assert response.status_code == 400
    assert "attempt" in response.json()["detail"].lower()


async def test_verify_email_lockout_after_max_attempts(
    async_client: AsyncClient,
    fixed_otp,
):
    email = "lockout@example.com"
    await _register(async_client, email)

    for _ in range(settings.EMAIL_VERIFICATION_MAX_ATTEMPTS):
        response = await _verify(async_client, email, "000001")
        assert response.status_code in (400, 429)

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 429


async def test_resend_after_lockout_allows_verification(
    async_client: AsyncClient,
    fixed_otp,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.auth.settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS",
        0,
    )

    email = "resend.recovery@example.com"
    await _register(async_client, email)

    for _ in range(settings.EMAIL_VERIFICATION_MAX_ATTEMPTS):
        await _verify(async_client, email, "000001")

    resend = await async_client.post(
        "/auth/resend-verification",
        json={"email": email},
    )
    assert resend.status_code == 200

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 200


async def test_resend_verification_respects_cooldown(
    async_client: AsyncClient,
    fixed_otp,
):
    email = "cooldown@example.com"
    await _register(async_client, email)

    response = await async_client.post(
        "/auth/resend-verification",
        json={"email": email},
    )
    assert response.status_code == 429
    assert "wait" in response.json()["detail"].lower()


async def test_verify_email_already_verified_returns_200(
    async_client: AsyncClient,
    user_factory,
    fixed_otp,
):
    user = await user_factory(email="verified@example.com", is_verified=True)

    response = await _verify(async_client, user.email, "123456")
    assert response.status_code == 200


async def test_verify_portfolio_mode_uses_predictable_code(
    async_client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch,
):
    monkeypatch.setattr("app.services.auth.settings.PORTFOLIO_MODE", True)

    email = "portfolio@example.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, settings.PORTFOLIO_VERIFICATION_CODE)
    assert response.status_code == 200

    from app.crud import user as user_crud

    user = await user_crud.get_user_by_email(db_session, email)
    assert user is not None
    assert user.is_verified is True


async def test_verify_portfolio_mode_wrong_code_increments_attempts(
    async_client: AsyncClient,
    monkeypatch,
):
    monkeypatch.setattr("app.services.auth.settings.PORTFOLIO_MODE", True)

    email = "portfolio.wrong@example.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, "000001")
    assert response.status_code == 400
    assert "attempt" in response.json()["detail"].lower()


async def test_verify_portfolio_mode_resend_respects_cooldown(
    async_client: AsyncClient,
    monkeypatch,
):
    monkeypatch.setattr("app.services.auth.settings.PORTFOLIO_MODE", True)

    email = "portfolio.cooldown@example.com"
    await _register(async_client, email)

    response = await async_client.post(
        "/auth/resend-verification",
        json={"email": email},
    )
    assert response.status_code == 429
    assert "wait" in response.json()["detail"].lower()


async def test_verify_portfolio_code_rejected_when_disabled(
    async_client: AsyncClient,
    fixed_otp,
    monkeypatch,
):
    monkeypatch.setattr("app.services.auth.settings.PORTFOLIO_MODE", False)

    email = "noportfolio@example.com"
    await _register(async_client, email)

    response = await _verify(async_client, email, settings.PORTFOLIO_VERIFICATION_CODE)
    assert response.status_code == 400


async def test_verify_expired_code_returns_401(
    async_client: AsyncClient,
    fake_redis,
    fixed_otp,
):
    email = "expired@example.com"
    await _register(async_client, email)
    await fake_redis.flushall()

    response = await _verify(async_client, email, "123456")
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


async def test_verification_session_returns_cooldown_after_register(
    async_client: AsyncClient,
    fixed_otp,
):
    email = "session.cooldown@example.com"
    await _register(async_client, email)

    response = await async_client.post(
        "/auth/verification-session",
        json={"email": email},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["code_sent"] is False
    assert body["is_verified"] is False
    assert 0 < body["resend_cooldown_seconds"] <= settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS


async def test_verification_session_auto_sends_when_code_missing(
    async_client: AsyncClient,
    fake_redis,
    fixed_otp,
):
    email = "session.autosend@example.com"
    await _register(async_client, email)
    await fake_redis.flushall()

    response = await async_client.post(
        "/auth/verification-session",
        json={"email": email},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["code_sent"] is True
    assert body["resend_cooldown_seconds"] == settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS
