import uuid
from datetime import datetime, timezone

from app.core.exceptions import (
    AlreadyInCompanyException,
    CannotRemoveSelfException,
    CompanyNotFoundException,
    CompanyRequestNotFoundException,
    DuplicateCompanyRequestException,
    InsufficientPermissionsException,
    RequestAlreadyReviewedException,
    UserNotFoundException,
)
from app.crud import company as company_crud
from app.crud import user as user_crud
from app.models import CompanyRequest, User
from app.models.enums import RequestStatus
from sqlalchemy.ext.asyncio import AsyncSession


async def submit_company_request(
    db: AsyncSession, user: User, requested_nip: str
) -> CompanyRequest:
    if user.company_id is not None:
        raise AlreadyInCompanyException()

    existing = await company_crud.get_pending_request_for_user(db, user.id)
    if existing is not None:
        raise DuplicateCompanyRequestException()

    company = await company_crud.get_active_company_by_nip(db, requested_nip)
    if company is None:
        raise CompanyNotFoundException()

    return await company_crud.create_company_request(db, user.id, requested_nip)


async def list_my_requests(db: AsyncSession, user: User) -> list[CompanyRequest]:
    return await company_crud.get_requests_for_user(db, user.id)


async def list_pending_requests_for_admin(
    db: AsyncSession, admin: User
) -> list[CompanyRequest]:
    if admin.company_id is None:
        return []
    company = await company_crud.get_company_by_id(db, admin.company_id)
    if company is None:
        return []
    return await company_crud.get_pending_requests_by_nip(db, company.nip)


async def list_company_members(db: AsyncSession, admin: User) -> list[User]:
    if admin.company_id is None:
        return []
    return await user_crud.get_users_by_company_id(db, admin.company_id)


async def remove_company_member(
    db: AsyncSession, admin: User, user_id: uuid.UUID
) -> User:
    target = await user_crud.get_user_by_id(db, user_id)
    if target is None:
        raise UserNotFoundException()
    if target.company_id != admin.company_id:
        raise InsufficientPermissionsException()
    if target.id == admin.id:
        raise CannotRemoveSelfException()
    await user_crud.set_user_company(db, target, None)
    return target


async def review_request(
    db: AsyncSession, admin: User, request_id: uuid.UUID, approve: bool
) -> CompanyRequest:
    req = await company_crud.get_request_by_id(db, request_id)
    if req is None:
        raise CompanyRequestNotFoundException()

    if req.status != RequestStatus.PENDING:
        raise RequestAlreadyReviewedException()

    if admin.company_id is None:
        raise InsufficientPermissionsException()

    admin_company = await company_crud.get_company_by_id(db, admin.company_id)
    if admin_company is None or req.requested_nip != admin_company.nip:
        raise InsufficientPermissionsException()

    if approve:
        applicant = await user_crud.get_user_by_id(db, req.user_id)
        if applicant is not None:
            await user_crud.set_user_company(db, applicant, admin_company.id)
        req.status = RequestStatus.APPROVED
    else:
        req.status = RequestStatus.REJECTED

    req.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(req)
    return req
