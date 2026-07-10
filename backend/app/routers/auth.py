from app.core import security
from app.core.dependencies import get_current_user
from app.core.verification_deps import get_verification_code_store
from app.database import get_db
from app.models import User
from app.schemas import (
    EmailVerificationIn,
    MessageOut,
    ResendVerificationIn,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
    VerificationSessionIn,
    VerificationSessionOut,
)
from app.services import auth as auth_service
from app.services.verification_code_store import VerificationCodeStore
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=MessageOut, status_code=status.HTTP_201_CREATED
)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    store: VerificationCodeStore = Depends(get_verification_code_store),
):
    """Register a new user with automatic B2B domain matching (Fast Track)."""
    await auth_service.register_user(db, user_in, store)
    return MessageOut(
        message="Registration successful. Please check your email for the verification code."
    )


@router.post("/verify", response_model=MessageOut, status_code=status.HTTP_200_OK)
async def verify_email(
    body: EmailVerificationIn,
    db: AsyncSession = Depends(get_db),
    store: VerificationCodeStore = Depends(get_verification_code_store),
):
    """Verify a user's email with a 6-digit OTP."""
    user = await auth_service.verify_user_email_by_code(
        db, store, body.email, body.code
    )
    return MessageOut(message=f"Email {user.email} has been successfully verified.")


@router.post(
    "/verification-session",
    response_model=VerificationSessionOut,
    status_code=status.HTTP_200_OK,
)
async def verification_session(
    body: VerificationSessionIn,
    db: AsyncSession = Depends(get_db),
    store: VerificationCodeStore = Depends(get_verification_code_store),
):
    """Expose resend cooldown and auto-send a code when none is active."""
    session = await auth_service.prepare_verification_session(db, store, body.email)
    return VerificationSessionOut(
        resend_cooldown_seconds=session.resend_cooldown_seconds,
        code_sent=session.code_sent,
        is_verified=session.is_verified,
    )


@router.post(
    "/resend-verification",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
)
async def resend_verification(
    body: ResendVerificationIn,
    db: AsyncSession = Depends(get_db),
    store: VerificationCodeStore = Depends(get_verification_code_store),
):
    """Resend the email verification OTP."""
    await auth_service.resend_verification_code(db, store, body.email)
    return MessageOut(message="If an unverified account exists, a new code has been sent.")


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Standard JSON login endpoint."""
    user = await auth_service.authenticate_user(db, user_in.email, user_in.password)

    access_token = security.create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's identity and role (source of truth for the frontend)."""
    return current_user
