import uuid

from app.core.dependencies import get_current_user, require_company_admin
from app.database import get_db
from app.models import User
from app.schemas.company import (
    CompanyRequestAdminOut,
    CompanyRequestCreate,
    CompanyRequestOut,
)
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
