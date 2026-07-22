import jwt
from app.core.security import get_password_hash
from app.core.settings import settings
from httpx import AsyncClient


async def test_login_success_returns_valid_jwt(
    async_client: AsyncClient, user_factory: callable
):
    """
    Happy Path: Valid credentials return a 200 OK with a valid JWT access token
    that contains the correct user ID as the subject ('sub').
    """
    # Create a verified user with a known password
    raw_password = "SecurePassword123!"
    hashed_password = get_password_hash(raw_password)
    user = await user_factory(
        email="login.success@example.com",
        password_hash=hashed_password,
        is_verified=True,
    )
    payload = {"email": user.email, "password": raw_password}

    # Act
    response = await async_client.post("/auth/login", json=payload)

    # HTTP Response
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    #  Token Validity and Content
    token = data["access_token"]
    decoded_payload = jwt.decode(
        token,
        settings.SECRET_KEY.get_secret_value(),
        algorithms=[settings.ALGORITHM],
    )

    # In JWT, the subject ('sub') is cast to a string
    assert decoded_payload["sub"] == str(user.id)


async def test_login_wrong_password_returns_401(
    async_client: AsyncClient, user_factory: callable
):
    """
    Negative Path: Ensure providing a wrong password returns a 401
    with a generic security message.
    """
    hashed_password = get_password_hash("CorrectPassword123!")
    user = await user_factory(
        email="wrong.pass@example.com", password_hash=hashed_password, is_verified=True
    )
    payload = {"email": user.email, "password": "WrongPassword123!"}

    response = await async_client.post("/auth/login", json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


async def test_login_non_existent_email_returns_401(async_client: AsyncClient):
    """
    Negative Path: Ensure attempting to log in with an email not in the database
    returns a 401 with the exact same generic message (preventing email enumeration).
    """
    # We do NOT create a user in the database here
    payload = {"email": "ghost@example.com", "password": "AnyPassword123!"}

    response = await async_client.post("/auth/login", json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


async def test_login_unverified_email_returns_403(
    async_client: AsyncClient, user_factory: callable
):
    """
    Negative Path: Ensure a user who hasn't verified their email is blocked
    from getting an access token and receives a 403 Forbidden.
    """
    raw_password = "SecurePassword123!"
    hashed_password = get_password_hash(raw_password)
    user = await user_factory(
        email="unverified@example.com",
        password_hash=hashed_password,
        is_verified=False,  # Key condition for this test
    )
    payload = {"email": user.email, "password": raw_password}

    response = await async_client.post("/auth/login", json=payload)

    assert response.status_code == 403
    assert response.json()["detail"] == "Email not verified. Please check your inbox."
