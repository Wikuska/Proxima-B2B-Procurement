from datetime import datetime, timedelta, timezone

import jwt
import pytest
from app.core.security import create_verification_token
from app.core.settings import settings
from app.models import Company
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# FIXTURES - DATABASE SETUP


@pytest.fixture
async def setup_companies(db_session: AsyncSession):
    """
    Inserts two companies into the database: one active, one inactive.
    Returns them in a dictionary to access their IDs during tests.
    """
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


# BUSINESS LOGIC TESTS


async def test_verify_email_assigns_active_company(
    async_client: AsyncClient,
    db_session: AsyncSession,
    setup_companies: dict,
    user_factory,
):
    """
    Happy Path: If the user's domain matches an active company,
    successfully assign the company_id.
    """
    user = await user_factory(email="test@active.com")

    # Generate a valid verification token for our user
    token = create_verification_token(email=user.email)

    # Hit the verification endpoint
    response = await async_client.get(f"/auth/verify?token={token}")

    # Check HTTP response status and message
    assert response.status_code == 200
    assert "successfully verified" in response.json()["message"]

    # Verify the actual database state
    await db_session.refresh(user)

    assert user.is_verified is True
    # The user must have the active company's ID assigned
    assert user.company_id == setup_companies["active"].id


async def test_verify_email_ignores_inactive_company(
    async_client: AsyncClient,
    db_session: AsyncSession,
    setup_companies: dict,
    user_factory,
):
    """
    Negative/Edge Path: If the domain matches an INACTIVE company,
    leave company_id as None.
    """
    # Create a user on the fly with the inactive company's domain
    user = await user_factory(email="test@inactive.com")

    token = create_verification_token(email=user.email)

    # Hit the verification endpoint
    response = await async_client.get(f"/auth/verify?token={token}")

    assert response.status_code == 200

    await db_session.refresh(user)
    assert user.is_verified is True
    # Fast Track assignment must NOT work for inactive companies
    assert user.company_id is None


async def test_verify_email_no_matching_company(
    async_client: AsyncClient, db_session: AsyncSession, user_factory
):
    """
    Happy Path (B2C / No Match): If the user's domain does not match ANY company
    in the database, verify the email but leave company_id as None.
    """
    # Arrange: Create a user with a domain that doesn't exist in our DB
    user = await user_factory(email="client@random-domain.com")

    token = create_verification_token(email=user.email)

    # Hit the verification endpoint
    response = await async_client.get(f"/auth/verify?token={token}")

    # Should return 200 OK
    assert response.status_code == 200

    # Verify the database state
    await db_session.refresh(user)

    assert user.is_verified is True
    # Fast Track should gracefully skip assignment
    assert user.company_id is None


async def test_verify_email_expired_token_returns_401(async_client: AsyncClient):
    """Expired token should return 401."""

    expire = datetime.now(timezone.utc) - timedelta(hours=1)
    token = jwt.encode(
        {"exp": expire, "sub": "test@example.com", "type": "email_verification"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    response = await async_client.get(f"/auth/verify?token={token}")
    assert response.status_code == 401

    assert response.json()["detail"] == "Token has expired"


async def test_verify_email_invalid_token_returns_401(async_client: AsyncClient):
    """Tampered token should return 401."""
    response = await async_client.get("/auth/verify?token=this.is.invalid")
    assert response.status_code == 401

    assert response.json()["detail"] == "Invalid token"


async def test_verify_email_wrong_token_type_returns_401(async_client: AsyncClient):
    """Ensure using an access token instead of a verification token returns 401."""
    from app.core.security import create_access_token

    access_token = create_access_token(subject="test@example.com")

    response = await async_client.get(f"/auth/verify?token={access_token}")

    assert response.status_code == 401

    assert response.json()["detail"] == "Invalid token type"


async def test_verify_email_already_verified_returns_200(
    async_client: AsyncClient, user_factory
):
    """Already verified user should return 200 without error."""
    user = await user_factory(is_verified=True)

    token = create_verification_token(email=user.email)
    response = await async_client.get(f"/auth/verify?token={token}")
    assert response.status_code == 200
