import uuid

from app.core import security
from app.core.exceptions import (
    AccountDeactivatedException,
    AppException,
    InsufficientPermissionsException,
    InvalidTokenException,
    NotAuthenticatedException,
)
from app.crud import user as user_crud
from app.database import get_db
from app.models import User, UserRole
from app.schemas import TokenData
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

# auto_error=False: we raise our own domain exceptions (mapped to HTTP in main.py)
# and need the no-credentials case to fall through for the optional variant.
bearer_scheme = HTTPBearer(auto_error=False)


async def _resolve_user_from_token(
    credentials: HTTPAuthorizationCredentials | None,
    db: AsyncSession,
) -> User:
    """Decodes the bearer token and loads the matching active user from the DB.

    The database is the single source of truth for identity and role — the token
    only carries `sub`. Raises domain exceptions on any failure.
    """
    if credentials is None:
        raise NotAuthenticatedException()

    payload = security.decode_access_token(credentials.credentials)
    token_data = TokenData(sub=payload.get("sub"))
    if token_data.sub is None:
        raise InvalidTokenException()

    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise InvalidTokenException()

    user = await user_crud.get_user_by_id(db, user_id)
    # Don't leak account existence — a valid-but-unknown subject is "not authenticated".
    if user is None:
        raise NotAuthenticatedException()
    if not user.is_active:
        raise AccountDeactivatedException()

    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency for protected endpoints — requires a valid token and active user."""
    return await _resolve_user_from_token(credentials, db)


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Dependency for guest-friendly endpoints (e.g. cart).

    Returns the user when a valid token is present, otherwise ``None``. A missing,
    invalid, or expired token never blocks the request — it just yields a guest.
    """
    try:
        return await _resolve_user_from_token(credentials, db)
    except AppException:
        return None


def require_role(*allowed: UserRole):
    """Dependency factory enforcing role-based access control.

    Usage: ``Depends(require_role(UserRole.ADMIN))``. Returns the current user when
    their role is allowed, otherwise raises ``InsufficientPermissionsException``.
    """

    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise InsufficientPermissionsException()
        return user

    return checker


# Convenience guards for use in later roadmap steps (dashboards, admin endpoints).
require_admin = require_role(UserRole.ADMIN)
require_company_admin = require_role(UserRole.COMPANY_ADMIN, UserRole.ADMIN)
