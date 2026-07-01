import uuid

from app.core.dependencies import get_current_user, require_company_admin
from app.database import get_db
from app.models import User
from app.schemas.address import AddressIn, AddressOut
from app.schemas.common import MessageOut
from app.schemas.company import (
    CompanyAffiliationOut,
    CompanyMemberOut,
    CompanyRequestAdminOut,
    CompanyRequestCreate,
    CompanyRequestOut,
)
from app.services import address as address_service
from app.services import company as company_service
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post(
    "/requests",
    response_model=CompanyRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_request(
    payload: CompanyRequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.submit_company_request(db, user, payload.requested_nip)


@router.get("/requests/me", response_model=list[CompanyRequestOut])
async def my_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.list_my_requests(db, user)


@router.get("/requests/pending", response_model=list[CompanyRequestAdminOut])
async def pending_requests(
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.list_pending_requests_for_admin(db, admin)


@router.post(
    "/requests/{request_id}/approve",
    response_model=CompanyRequestOut,
)
async def approve_request(
    request_id: uuid.UUID,
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.review_request(db, admin, request_id, approve=True)


@router.post(
    "/requests/{request_id}/reject",
    response_model=CompanyRequestOut,
)
async def reject_request(
    request_id: uuid.UUID,
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.review_request(db, admin, request_id, approve=False)


@router.get("/me", response_model=CompanyAffiliationOut)
async def get_my_affiliation(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.get_my_affiliation(db, user)


@router.delete("/me/affiliation", response_model=MessageOut)
async def leave_company(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await company_service.leave_company(db, user)
    return MessageOut(message="You have left the company")


@router.get("/members", response_model=list[CompanyMemberOut])
async def list_members(
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    return await company_service.list_company_members(db, admin)


@router.delete("/members/{user_id}", response_model=MessageOut)
async def remove_member(
    user_id: uuid.UUID,
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    await company_service.remove_company_member(db, admin, user_id)
    return MessageOut(message="Member removed successfully")


@router.get("/addresses/shipping", response_model=list[AddressOut])
async def list_company_shipping_addresses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await address_service.list_company_shipping_addresses(db, user)


@router.get("/addresses/billing", response_model=AddressOut | None)
async def get_company_billing_address(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await address_service.get_company_billing_address(db, user)


@router.post(
    "/addresses",
    response_model=AddressOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_company_address(
    payload: AddressIn,
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    return await address_service.create_company_address(db, admin, payload)


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_address(
    address_id: uuid.UUID,
    admin: User = Depends(require_company_admin),
    db: AsyncSession = Depends(get_db),
):
    await address_service.delete_company_address(db, admin, address_id)
