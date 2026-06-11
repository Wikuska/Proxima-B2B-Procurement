from app.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetches a user by their email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: dict) -> User:
    """Creates a new user in the database."""
    new_user = User(**user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def mark_user_as_verified(
    db: AsyncSession, user: User, company_id: int | None
) -> User:
    """Marks a user's email as verified and assigns B2B company if matched."""
    user.is_verified = True
    user.company_id = company_id
    await db.commit()
    await db.refresh(user)
    return user
