import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
    InvalidTokenTypeException,
)
from app.core.settings import settings
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def generate_verification_code() -> str:
    """Cryptographically secure 6-digit OTP for email verification."""
    return f"{secrets.randbelow(1_000_000):06d}"


def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """Generates a JWT access token for login and authentication.

    The token only proves identity (``sub``); the user's role is read from the
    database (single source of truth), never carried in the token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decodes the access token. Returns the payload or raises an exception if the token is invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[settings.ALGORITHM],
        )

    except ExpiredSignatureError:
        raise ExpiredTokenException()
    except InvalidTokenError:
        raise InvalidTokenException()

    if payload.get("type") != "access":
        raise InvalidTokenTypeException()

    return payload
