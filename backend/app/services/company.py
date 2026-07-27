import uuid
from datetime import datetime, timezone

from app.core.exceptions import (
    AlreadyInCompanyException,
    CannotRemoveSelfException,
    CompanyNotFoundException,
    CompanyRequestNotFoundException,
    DuplicateCompanyRequestException,
    InsufficientPermissionsException,
    InvalidTransferTargetException,
    LastCompanyAdminException,
    NotInCompanyException,
    OrderNotFoundException,
    RequestAlreadyReviewedException,
    UserNotFoundException,
)
from app.crud import company as company_crud
from app.crud import order as order_crud
from app.crud import user as user_crud
from app.models import Company, CompanyRequest, User
from app.models.enums import OrderStatus, RequestStatus, UserRole
from app.models.order import Order
from app.schemas.company import (
    CompanyOrderOut,
    CompanyOrderSummaryOut,
    CompanySettingsUpdate,
    RequesterMini,
)
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


async def leave_company(db: AsyncSession, user: User) -> User:
    if user.company_id is None:
        raise NotInCompanyException()
    if user.role == UserRole.COMPANY_ADMIN:
        count = await user_crud.count_company_admins_in_company(db, user.company_id)
        if count <= 1:
            raise LastCompanyAdminException()
        user.role = UserRole.CUSTOMER
    return await user_crud.set_user_company(db, user, None)


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


async def get_company_settings(db: AsyncSession, admin: User) -> Company:
    if admin.company_id is None:
        raise NotInCompanyException()
    company = await company_crud.get_company_by_id(db, admin.company_id)
    if company is None:
        raise CompanyNotFoundException()
    return company


async def update_company_settings(
    db: AsyncSession, admin: User, payload: CompanySettingsUpdate
) -> Company:
    company = await get_company_settings(db, admin)
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        return company
    return await company_crud.update_company_fields(db, company, fields)


async def transfer_company_ownership(
    db: AsyncSession, admin: User, target_user_id: uuid.UUID
) -> None:
    if admin.company_id is None:
        raise NotInCompanyException()
    if target_user_id == admin.id:
        raise CannotRemoveSelfException()

    target = await user_crud.get_user_by_id(db, target_user_id)
    if target is None:
        raise UserNotFoundException()
    if target.company_id != admin.company_id:
        raise InsufficientPermissionsException()
    if target.role == UserRole.COMPANY_ADMIN or target.role == UserRole.ADMIN:
        raise InvalidTransferTargetException()

    admin.role = UserRole.CUSTOMER
    target.role = UserRole.COMPANY_ADMIN
    await db.commit()


def _placed_by(order: Order) -> RequesterMini:
    return RequesterMini.model_validate(order.user)


def _to_company_order_summary(order: Order) -> CompanyOrderSummaryOut:
    return CompanyOrderSummaryOut(
        id=order.id,
        status=order.status,
        purchase_type=order.purchase_type,
        company_id=order.company_id,
        total_amount=order.total_amount,
        created_at=order.created_at,
        item_count=order.item_count,
        placed_by=_placed_by(order),
    )


def _to_company_order(order: Order) -> CompanyOrderOut:
    return CompanyOrderOut(
        id=order.id,
        status=order.status,
        purchase_type=order.purchase_type,
        company_id=order.company_id,
        payment_method=order.payment_method,
        total_amount=order.total_amount,
        note=order.note,
        created_at=order.created_at,
        billing_document=order.billing_document,
        shipment=order.shipment,
        items=order.items,
        placed_by=_placed_by(order),
    )


async def list_company_orders(
    db: AsyncSession,
    admin: User,
    status: OrderStatus | None = None,
) -> list[CompanyOrderSummaryOut]:
    if admin.company_id is None:
        return []
    orders = await order_crud.get_orders_for_company(db, admin.company_id, status)
    return [_to_company_order_summary(order) for order in orders]


async def get_company_order(
    db: AsyncSession, admin: User, order_id: uuid.UUID
) -> CompanyOrderOut:
    if admin.company_id is None:
        raise OrderNotFoundException()
    order = await order_crud.get_order_for_company(db, order_id, admin.company_id)
    if order is None:
        raise OrderNotFoundException()
    return _to_company_order(order)


async def get_my_affiliation(db: AsyncSession, user: User) -> dict:
    if user.company_id is None:
        raise NotInCompanyException()
    company = await company_crud.get_company_by_id(db, user.company_id)
    if company is None:
        raise NotInCompanyException()
    return {
        "company_name": company.name,
        "company_nip": company.nip,
        "discount_percentage": company.discount_percentage,
        "role": user.role,
        "joined_at": user.company_joined_at,
    }


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
