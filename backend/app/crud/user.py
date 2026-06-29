import uuid

from app.models import User
from app.models.enums import UserRole
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetches a user by their email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Fetches a user by their primary key."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: dict) -> User:
    """Creates a new user in the database."""
    new_user = User(**user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def mark_user_as_verified(
    db: AsyncSession, user: User, company_id: uuid.UUID | None
) -> User:
    """Marks a user's email as verified and assigns B2B company if matched."""
    user.is_verified = True
    user.company_id = company_id
    await db.commit()
    await db.refresh(user)
    return user


async def set_user_company(
    db: AsyncSession, user: User, company_id: uuid.UUID | None
) -> User:
    user.company_id = company_id
    await db.commit()
    await db.refresh(user)
    return user


async def get_users_by_company_id(
    db: AsyncSession, company_id: uuid.UUID
) -> list[User]:
    result = await db.execute(
        select(User).where(User.company_id == company_id)
    )
    return list(result.scalars().all())


async def count_company_admins_in_company(
    db: AsyncSession, company_id: uuid.UUID
) -> int:
    result = await db.execute(
        select(func.count()).where(
            User.company_id == company_id,
            User.role == UserRole.COMPANY_ADMIN,
        )
    )
    return result.scalar_one()
