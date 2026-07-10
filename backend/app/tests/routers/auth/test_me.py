from datetime import timedelta

import jwt
import pytest
from app.core.dependencies import (
    get_optional_current_user,
    require_role,
)
from app.core.exceptions import InsufficientPermissionsException
from app.core.security import create_access_token
from app.core.settings import settings
from app.models.enums import UserRole
from httpx import AsyncClient


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# GET /auth/me — IDENTITY ENDPOINT


async def test_me_with_valid_token_returns_user(
    async_client: AsyncClient, user_factory: callable
):
    """A valid token returns 200 with the user's identity and DB role."""
    user = await user_factory(
        email="me.success@example.com",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
    )
    token = create_access_token(subject=str(user.id))

    response = await async_client.get("/auth/me", headers=_auth_header(token))

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(user.id)
    assert data["email"] == user.email
    assert data["role"] == UserRole.COMPANY_ADMIN.value


async def test_me_without_authorization_header_returns_401(async_client: AsyncClient):
    """A missing token is rejected with 401 Not authenticated."""
    response = await async_client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


async def test_me_with_expired_token_returns_401(
    async_client: AsyncClient, user_factory: callable
):
    """An expired token is rejected with 401."""
    user = await user_factory(email="me.expired@example.com", is_verified=True)
    token = create_access_token(
        subject=str(user.id), expires_delta=timedelta(minutes=-1)
    )

    response = await async_client.get("/auth/me", headers=_auth_header(token))

    assert response.status_code == 401


async def test_me_with_tampered_token_returns_401(async_client: AsyncClient):
    """A malformed/tampered token is rejected with 401."""
    response = await async_client.get(
        "/auth/me", headers=_auth_header("this.is.not.a.valid.jwt")
    )

    assert response.status_code == 401


async def test_me_with_wrong_token_type_returns_401(async_client: AsyncClient):
    """A token with a non-access type cannot be used to authenticate."""
    from datetime import datetime, timezone

    verification_token = jwt.encode(
        {
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "sub": "test@example.com",
            "type": "email_verification",
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    response = await async_client.get(
        "/auth/me", headers=_auth_header(verification_token)
    )

    assert response.status_code == 401


async def test_me_for_deactivated_user_returns_403(
    async_client: AsyncClient, user_factory: callable
):
    """A valid token for a deactivated account is rejected with 403."""
    user = await user_factory(
        email="me.deactivated@example.com", is_verified=True, is_active=False
    )
    token = create_access_token(subject=str(user.id))

    response = await async_client.get("/auth/me", headers=_auth_header(token))

    assert response.status_code == 403


# require_role — RBAC GUARD


async def test_require_role_allows_matching_role(user_factory: callable):
    """An admin passes the admin guard and is returned."""
    admin = await user_factory(email="admin.ok@example.com", role=UserRole.ADMIN)
    guard = require_role(UserRole.ADMIN)

    result = await guard(user=admin)

    assert result is admin


async def test_require_role_rejects_other_role(user_factory: callable):
    """A customer hitting an admin-only guard is rejected."""
    customer = await user_factory(
        email="customer.denied@example.com", role=UserRole.CUSTOMER
    )
    guard = require_role(UserRole.ADMIN)

    with pytest.raises(InsufficientPermissionsException):
        await guard(user=customer)


# get_optional_current_user — GUEST-FRIENDLY VARIANT


async def test_optional_current_user_returns_none_without_token(db_session):
    """No credentials yields a guest (None) instead of raising."""
    result = await get_optional_current_user(credentials=None, db=db_session)

    assert result is None
