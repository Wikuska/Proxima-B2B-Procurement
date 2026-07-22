from datetime import datetime, timedelta, timezone

import jwt
import pytest
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
    InvalidTokenTypeException,
)
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_verification_code,
    get_password_hash,
    verify_password,
)
from app.core.settings import settings

# PASSWORD HASHING TESTS


def test_get_password_hash_returns_different_from_plain():
    """Ensure that the hashing algorithm modifies the plain password."""
    plain_password = "SecurePassword123!"

    hashed = get_password_hash(plain_password)

    assert hashed != plain_password
    assert isinstance(hashed, str)
    assert len(hashed) > 0


def test_verify_password_returns_true_for_correct_password():
    """Ensure that the correct password successfully passes verification."""
    plain_password = "SecurePassword123!"
    hashed = get_password_hash(plain_password)

    assert verify_password(plain_password, hashed) is True


def test_verify_password_returns_false_for_wrong_password():
    """Ensure that an incorrect password fails verification."""
    plain_password = "SecurePassword123!"
    wrong_password = "HackerPassword321!"
    hashed = get_password_hash(plain_password)

    assert verify_password(wrong_password, hashed) is False


# JWT ACCESS TOKEN TESTS


def test_create_access_token_returns_string():
    """Ensure the generated access token is a string."""
    token = create_access_token(subject="user_12345")

    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_contains_correct_claims():
    """Ensure the generated access token contains the correct payload claims."""
    subject = "user_12345"

    token = create_access_token(subject=subject)
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY.get_secret_value(),
        algorithms=[settings.ALGORITHM],
    )

    assert decoded["sub"] == subject
    assert decoded["type"] == "access"
    assert "exp" in decoded


def test_decode_access_token_returns_correct_payload():
    """Ensure our decoding function correctly retrieves the payload."""
    subject = "user_12345"
    token = create_access_token(subject=subject)

    payload = decode_access_token(token)

    assert payload["sub"] == subject
    assert payload["type"] == "access"
    assert "exp" in payload


def test_decode_access_token_raises_expired_token_exception():
    """Ensure an expired token raises the appropriate exception."""
    subject = "user_12345"
    # Create a token that expired 1 minute ago using the expires_delta parameter
    token = create_access_token(
        subject=subject, expires_delta=timedelta(minutes=-1)
    )

    with pytest.raises(ExpiredTokenException):
        decode_access_token(token)


def test_decode_access_token_raises_invalid_token_exception():
    """Ensure a tampered or malformed token raises the appropriate exception."""

    tampered_token = "this.is.not.a.valid.jwt"

    with pytest.raises(InvalidTokenException):
        decode_access_token(tampered_token)


def test_decode_access_token_raises_invalid_token_type_exception():
    """Ensure a token with the wrong 'type' claim is rejected by the access token decoder."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    verification_token = jwt.encode(
        {"exp": expire, "sub": "test@example.com", "type": "email_verification"},
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM,
    )

    with pytest.raises(InvalidTokenTypeException):
        decode_access_token(verification_token)


# EMAIL VERIFICATION OTP TESTS


def test_generate_verification_code_is_six_digits():
    code = generate_verification_code()
    assert len(code) == 6
    assert code.isdigit()


def test_generate_verification_code_is_unique_enough():
    codes = {generate_verification_code() for _ in range(20)}
    assert len(codes) > 1
