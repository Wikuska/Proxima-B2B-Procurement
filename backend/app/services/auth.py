from core.exceptions import (
    EmailAlreadyExistsException,
    EmailNotVerifiedException,
    InvalidCredentialsException,
    UserNotFoundException,
)
from core.security import (
    create_verification_token,
    decode_verification_token,
    get_password_hash,
    verify_password,
)
from crud import company as company_crud
from crud import user as user_crud
from models import User
from schemas import UserCreate, UserRole
from sqlalchemy.ext.asyncio import AsyncSession


async def register_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Registers a new user."""

    # Email availability check
    if await user_crud.get_user_by_email(db, user_data.email):
        raise EmailAlreadyExistsException()

    # Setting user data
    user_dict = {
        **user_data.model_dump(exclude={"password"}),
        "hashed_password": get_password_hash(user_data.password),
        "role": UserRole.CUSTOMER,
        "company_id": None,
        "is_verified": False,
        "is_active": True,
    }

    # Create user in DB
    new_user = await user_crud.create_user(db, user_dict)

    # Sending verification email (mocked)
    verification_token = create_verification_token(new_user.email)
    verification_url = (
        f"http://localhost:8000/api/v1/auth/verify?token={verification_token}"
    )

    print("\n" + "=" * 80)
    print("  MOCK EMAIL SERVICE (DOUBLE OPT-IN)")
    print(f"  To: {new_user.email} ({new_user.first_name} {new_user.last_name})")
    print(f"  Click the link to verify your account:\n  {verification_url}")
    print("=" * 80 + "\n")

    return new_user


async def verify_user_email(db: AsyncSession, token: str) -> User:
    """Verifies a user's email using the provided token and assigns B2B company if matched."""
    email = decode_verification_token(token)
    user = await user_crud.get_user_by_email(db, email)
    if not user:
        raise UserNotFoundException()
    if user.is_verified:
        return user

    email_domain = email.split("@")[-1].lower()
    matched_company = await company_crud.get_active_by_domain(db, email_domain)
    company_id = matched_company.id if matched_company else None

    return await user_crud.mark_user_as_verified(db, user, company_id)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Authenticates a user and returns their information."""
    user = await user_crud.get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsException()

    if not user.is_verified:
        raise EmailNotVerifiedException()

    return user
