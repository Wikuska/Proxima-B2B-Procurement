import time
from dataclasses import dataclass

from app.core.exceptions import (
    AccountDeactivatedException,
    EmailAlreadyExistsException,
    EmailNotVerifiedException,
    ExpiredVerificationCodeException,
    InvalidCredentialsException,
    InvalidVerificationCodeException,
    ResendCooldownException,
    TooManyVerificationAttemptsException,
    UserNotFoundException,
    VerificationInProgressException,
)
from app.core.security import (
    generate_verification_code,
    get_password_hash,
    verify_password,
)
from app.core.settings import settings
from app.crud import company as company_crud
from app.crud import user as user_crud
from app.models import User
from app.models.enums import UserRole
from app.schemas import UserCreate
from app.services.verification_code_store import VerificationCodeStore
from sqlalchemy.ext.asyncio import AsyncSession


async def _assign_company_on_verify(db: AsyncSession, user: User) -> User:
    email_domain = user.email.split("@")[-1].lower()
    matched_company = await company_crud.get_active_by_domain(db, email_domain)
    company_id = matched_company.id if matched_company else None
    return await user_crud.mark_user_as_verified(db, user, company_id)


@dataclass(frozen=True)
class VerificationSession:
    resend_cooldown_seconds: int
    code_sent: bool
    is_verified: bool = False


def _resend_cooldown_remaining(sent_at: int) -> int:
    elapsed = int(time.time()) - sent_at
    return max(0, settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS - elapsed)


async def _issue_verification_code(
    store: VerificationCodeStore, email: str
) -> str:
    """Generate OTP, persist hash in Redis, return plaintext for dev logging."""
    code = (
        settings.PORTFOLIO_VERIFICATION_CODE
        if settings.PORTFOLIO_MODE
        else generate_verification_code()
    )
    code_hash = get_password_hash(code)
    await store.save_code(email, code_hash)
    return code


def _log_verification_code(
    email: str, first_name: str, last_name: str, code: str
) -> None:
    print("\n" + "=" * 80)
    print("  MOCK EMAIL SERVICE (EMAIL VERIFICATION OTP)")
    print(f"  To: {email} ({first_name} {last_name})")
    print(f"  Your verification code: {code}")
    print("=" * 80 + "\n")


async def register_user(
    db: AsyncSession, user_data: UserCreate, store: VerificationCodeStore
) -> User:
    """Registers a new user and issues an email verification OTP stored in Redis."""
    if await user_crud.get_user_by_email(db, user_data.email):
        raise EmailAlreadyExistsException()

    user_dict = {
        **user_data.model_dump(exclude={"password"}),
        "password_hash": get_password_hash(user_data.password),
        "role": UserRole.CUSTOMER,
        "company_id": None,
        "is_verified": False,
        "is_active": True,
    }

    new_user = await user_crud.create_user(db, user_dict)

    code = await _issue_verification_code(store, new_user.email)
    _log_verification_code(
        new_user.email, new_user.first_name, new_user.last_name, code
    )

    return new_user


async def resend_verification_code(
    db: AsyncSession, store: VerificationCodeStore, email: str
) -> None:
    user = await user_crud.get_user_by_email(db, email)
    if not user:
        raise UserNotFoundException()
    if user.is_verified:
        return

    challenge = await store.get_challenge(email)
    if challenge is not None:
        remaining = _resend_cooldown_remaining(challenge.sent_at)
        if remaining > 0:
            raise ResendCooldownException(retry_after_seconds=remaining)

    code = await _issue_verification_code(store, email)
    _log_verification_code(user.email, user.first_name, user.last_name, code)


async def prepare_verification_session(
    db: AsyncSession, store: VerificationCodeStore, email: str
) -> VerificationSession:
    """Return resend cooldown and auto-send a code when none is active in Redis."""
    user = await user_crud.get_user_by_email(db, email)
    if not user:
        raise UserNotFoundException()
    if user.is_verified:
        return VerificationSession(
            resend_cooldown_seconds=0,
            code_sent=False,
            is_verified=True,
        )

    challenge = await store.get_challenge(email)
    if challenge is None:
        code = await _issue_verification_code(store, email)
        _log_verification_code(user.email, user.first_name, user.last_name, code)
        return VerificationSession(
            resend_cooldown_seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
            code_sent=True,
        )

    return VerificationSession(
        resend_cooldown_seconds=_resend_cooldown_remaining(challenge.sent_at),
        code_sent=False,
    )


async def verify_user_email_by_code(
    db: AsyncSession,
    store: VerificationCodeStore,
    email: str,
    code: str,
) -> User:
    user = await user_crud.get_user_by_email(db, email)
    if not user:
        raise UserNotFoundException()
    if user.is_verified:
        return user

    if not await store.acquire_verify_lock(email):
        raise VerificationInProgressException()

    try:
        challenge = await store.get_challenge(email)
        if challenge is None:
            raise ExpiredVerificationCodeException()

        max_attempts = settings.EMAIL_VERIFICATION_MAX_ATTEMPTS
        if challenge.attempts >= max_attempts:
            raise TooManyVerificationAttemptsException()

        if not verify_password(code, challenge.code_hash):
            attempts = await store.increment_attempts(email)
            attempts_left = max_attempts - attempts
            if attempts >= max_attempts:
                raise TooManyVerificationAttemptsException()
            raise InvalidVerificationCodeException(attempts_left=attempts_left)

        verified = await _assign_company_on_verify(db, user)
        await store.delete_code(email)
        return verified
    finally:
        await store.release_verify_lock(email)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Authenticates a user and returns their information."""
    user = await user_crud.get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise InvalidCredentialsException()

    if not user.is_active:
        raise AccountDeactivatedException()

    if not user.is_verified:
        raise EmailNotVerifiedException()

    return user
