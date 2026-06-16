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


def create_access_token(
    subject: str | Any, role: str, expires_delta: timedelta | None = None
) -> str:
    """Generates a JWT access token for login and authentication"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject), "role": role, "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def create_verification_token(email: str) -> str:
    """Generates a token for email verification (Double Opt-In). Valid for 24 hours."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email, "type": "email_verification"}

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodes the access token. Returns the payload or raises an exception if the token is invalid."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

    except ExpiredSignatureError:
        raise ExpiredTokenException()
    except InvalidTokenError:
        raise InvalidTokenException()

    if payload.get("type") != "access":
        raise InvalidTokenTypeException()

    return payload


def decode_verification_token(token: str) -> str:
    """Decodes the email verification token. Returns the email address (sub) or raises an exception."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

    except ExpiredSignatureError:
        raise ExpiredTokenException()
    except InvalidTokenError:
        raise InvalidTokenException()

    if payload.get("type") != "email_verification":
        raise InvalidTokenTypeException()

    return payload.get("sub")
