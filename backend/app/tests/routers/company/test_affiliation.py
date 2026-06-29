from decimal import Decimal

from app.models.enums import UserRole
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# GET /companies/me
# ---------------------------------------------------------------------------


async def test_get_affiliation_in_company(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """User in company → 200 with name, NIP, discount, role, joined_at."""
    company = await company_factory(nip="9999999999", discount_percentage=Decimal("20.00"))
    user = await user_factory(
        email="affiliated@test.com", is_verified=True, company_id=company.id
    )

    response = await async_client.get("/companies/me", headers=auth_headers(user))

    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == company.name
    assert data["company_nip"] == "9999999999"
    assert Decimal(data["discount_percentage"]) == Decimal("20.00")
    assert data["role"] == user.role.value
    assert "joined_at" in data


async def test_get_affiliation_not_in_company(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """User without company → 400 NotInCompany."""
    user = await user_factory(email="nocompany2@test.com", is_verified=True)

    response = await async_client.get("/companies/me", headers=auth_headers(user))

    assert response.status_code == 400


async def test_get_affiliation_unauthenticated(
    async_client: AsyncClient,
):
    """No token → 401."""
    response = await async_client.get("/companies/me")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# company_joined_at side-effects
# ---------------------------------------------------------------------------


async def test_approve_sets_company_joined_at(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """After request approval applicant has company_joined_at set."""
    import uuid

    company = await company_factory(nip="7777777777")
    admin = await user_factory(
        email="admin_approve@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )
    applicant = await user_factory(email="applicant_approve@test.com", is_verified=True)

    req_response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "7777777777"},
        headers=auth_headers(applicant),
    )
    assert req_response.status_code == 201
    request_id = req_response.json()["id"]

    await async_client.post(
        f"/companies/requests/{request_id}/approve",
        headers=auth_headers(admin),
    )

    await db_session.refresh(applicant)
    assert applicant.company_joined_at is not None


async def test_leave_clears_company_joined_at(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """After leaving company, company_joined_at is NULL."""
    from datetime import datetime, timezone

    company = await company_factory(nip="8888888888")
    user = await user_factory(
        email="leaver_date@test.com",
        is_verified=True,
        company_id=company.id,
        company_joined_at=datetime.now(timezone.utc),
    )

    response = await async_client.delete(
        "/companies/me/affiliation", headers=auth_headers(user)
    )

    assert response.status_code == 200
    await db_session.refresh(user)
    assert user.company_joined_at is None


# ---------------------------------------------------------------------------
# LEAVE
# ---------------------------------------------------------------------------


async def test_leave_company_customer_success(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """CUSTOMER with a company leaves successfully — company_id becomes NULL."""
    company = await company_factory(nip="1111111111")
    user = await user_factory(
        email="customer@test.com", is_verified=True, company_id=company.id
    )

    response = await async_client.delete(
        "/companies/me/affiliation", headers=auth_headers(user)
    )

    assert response.status_code == 200
    assert "left" in response.json()["message"].lower()

    await db_session.refresh(user)
    assert user.company_id is None


async def test_leave_company_not_in_company_returns_400(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """User with no company → 400 NotInCompany."""
    user = await user_factory(email="nocompany@test.com", is_verified=True)

    response = await async_client.delete(
        "/companies/me/affiliation", headers=auth_headers(user)
    )

    assert response.status_code == 400


async def test_leave_company_admin_with_second_admin_success(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """COMPANY_ADMIN leaves when another admin exists — company_id NULL, role → CUSTOMER."""
    company = await company_factory(nip="2222222222")
    admin = await user_factory(
        email="admin1@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )
    await user_factory(
        email="admin2@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )

    response = await async_client.delete(
        "/companies/me/affiliation", headers=auth_headers(admin)
    )

    assert response.status_code == 200

    await db_session.refresh(admin)
    assert admin.company_id is None
    assert admin.role == UserRole.CUSTOMER


async def test_leave_company_last_admin_returns_409(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Only COMPANY_ADMIN trying to leave → 409, no DB changes."""
    company = await company_factory(nip="3333333333")
    admin = await user_factory(
        email="onlyadmin@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )

    response = await async_client.delete(
        "/companies/me/affiliation", headers=auth_headers(admin)
    )

    assert response.status_code == 409

    await db_session.refresh(admin)
    assert admin.company_id == company.id
    assert admin.role == UserRole.COMPANY_ADMIN


async def test_leave_company_unauthenticated_returns_401(
    async_client: AsyncClient,
):
    """No token → 401."""
    response = await async_client.delete("/companies/me/affiliation")
    assert response.status_code == 401
