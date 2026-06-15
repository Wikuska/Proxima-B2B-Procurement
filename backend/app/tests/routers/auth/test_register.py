import pytest
from app.models.user import User
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def test_register_user_success(
    async_client: AsyncClient, db_session: AsyncSession
):
    """
    Happy Path: Ensure valid user data results in a successful registration,
    returns HTTP 201 Created, and correctly saves the user in the database.
    """
    # Setup valid payload
    payload = {
        "email": "new.user@example.com",
        "password": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    # Send POST request to the router
    response = await async_client.post("/auth/register", json=payload)

    # HTTP Response & JSON Payload
    assert response.status_code == 201

    data = response.json()
    assert data["email"] == payload["email"]
    assert data["first_name"] == payload["first_name"]
    assert data["last_name"] == payload["last_name"]

    # Critical security checks
    assert "password_hash" not in data
    assert "password" not in data

    # Assert default state
    assert data["is_verified"] is False
    assert data["is_active"] is True
    assert data["company_id"] is None

    # Assert: Database State
    db_session.expire_all()

    result = await db_session.execute(
        select(User).where(User.email == payload["email"])
    )
    db_user = result.scalar_one_or_none()

    # Ensure the user was actually persisted to the test database
    assert db_user is not None
    assert db_user.email == payload["email"]
    assert db_user.is_verified is False
    assert db_user.company_id is None


async def test_register_duplicate_email_returns_400(async_client: AsyncClient):
    """
    Negative Path: Ensure registering an email that already exists
    returns a 400 Bad Request exception.
    """
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    # Register the user for the first time (should succeed)
    await async_client.post("/auth/register", json=payload)

    # Attempt to register exactly the same user again
    response = await async_client.post("/auth/register", json=payload)

    # Verify the router catches the service exception
    assert response.status_code == 400

    assert response.json()["detail"] == "A user with this email already exists"


@pytest.mark.parametrize(
    "override_kwargs",
    [
        {"email": "invalid-email-format"},
        {"password": "short"},
        {"password": "nouppercase123!"},
        {"password": "NoDigitPassword!"},
        {"first_name": "A"},
        {"first_name": "$ylwia"},
        {"first_name": "Szy2mon"},
        {"last_name": "Kowal$ka"},
        {"last_name": "Bi3lski"},
    ],
    ids=[
        "invalid_email_format",
        "password_too_short",
        "password_missing_uppercase",
        "password_missing_digit",
        "first_name_too_short",
        "first_name_contains_special_chars",
        "first_name_contains_digits",
        "last_name_contains_special_chars",
        "last_name_contains_digits",
    ],
)
async def test_register_invalid_data_returns_422(
    async_client: AsyncClient,
    override_kwargs: dict,
):
    """
    Negative Path: Ensure invalid user data gets caught by Pydantic validation
    in the router and returns a 422 Unprocessable Entity.
    """
    # Start with a perfectly valid payload
    payload = {
        "email": "valid.user@example.com",
        "password": "ValidPassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    # Apply the specific invalid field for this test iteration
    payload.update(override_kwargs)

    # Send the bad data to the endpoint
    response = await async_client.post("/auth/register", json=payload)

    # Ensure Pydantic caught the error before it reached the service layer
    assert response.status_code == 422

    # Ensure the error message points to the correct field that was invalid
    data = response.json()
    error_locations = [error["loc"][-1] for error in data["detail"]]

    broken_field = list(override_kwargs.keys())[0]

    assert broken_field in error_locations


@pytest.mark.parametrize(
    "name_kwargs",
    [
        {"first_name": "Anna Maria"},  # Space in first name
        {"first_name": "Jean-Luc"},  # Hyphen in first name
        {"last_name": "von der Leyen"},  # Multiple spaces in last name
        {"last_name": "Kowalska-Nowak"},  # Hyphen in last name
        {
            "first_name": "Marie-Claire",
            "last_name": "De La Rosa",
        },  # Mix of both in one payload
    ],
    ids=[
        "first_name_with_space",
        "first_name_with_hyphen",
        "last_name_with_spaces",
        "last_name_with_hyphen",
        "complex_first_and_last_names",
    ],
)
async def test_register_valid_complex_names_returns_201(
    async_client: AsyncClient,
    name_kwargs: dict,
):
    """
    Happy Path: Ensure that valid edge cases for names (containing spaces or hyphens)
    successfully pass Pydantic validation and result in a created user.
    """
    # Start with a perfectly valid payload
    payload = {
        "email": "complex.names@example.com",
        "password": "ValidPassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    # Apply the specific valid names for this test iteration
    payload.update(name_kwargs)

    # Send the data to the endpoint
    response = await async_client.post("/auth/register", json=payload)

    # Ensure it passed validation and created the resource
    assert response.status_code == 201

    # Ensure the response contains the exact names we sent
    data = response.json()
    for key, expected_value in name_kwargs.items():
        assert data[key] == expected_value
