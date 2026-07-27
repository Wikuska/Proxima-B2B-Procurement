import uuid

from app.models import Company, CompanyRequest
from app.models.enums import RequestStatus
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def get_active_by_domain(db: AsyncSession, domain: str) -> Company | None:
    """Fetches an active company by email domain for Fast Track assignment."""
    result = await db.execute(
        select(Company).where(Company.email_domain == domain, Company.is_active)
    )
    return result.scalar_one_or_none()


async def get_active_company_by_nip(db: AsyncSession, nip: str) -> Company | None:
    result = await db.execute(
        select(Company).where(Company.nip == nip, Company.is_active)
    )
    return result.scalar_one_or_none()


async def get_company_by_id(
    db: AsyncSession, company_id: uuid.UUID
) -> Company | None:
    result = await db.execute(select(Company).where(Company.id == company_id))
    return result.scalar_one_or_none()


async def create_company_request(
    db: AsyncSession, user_id: uuid.UUID, requested_nip: str
) -> CompanyRequest:
    req = CompanyRequest(user_id=user_id, requested_nip=requested_nip)
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


async def get_pending_request_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> CompanyRequest | None:
    result = await db.execute(
        select(CompanyRequest).where(
            CompanyRequest.user_id == user_id,
            CompanyRequest.status == RequestStatus.PENDING,
        )
    )
    return result.scalar_one_or_none()


async def get_requests_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> list[CompanyRequest]:
    result = await db.execute(
        select(CompanyRequest)
        .where(CompanyRequest.user_id == user_id)
        .order_by(CompanyRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_pending_requests_by_nip(
    db: AsyncSession, nip: str
) -> list[CompanyRequest]:
    result = await db.execute(
        select(CompanyRequest)
        .where(
            CompanyRequest.requested_nip == nip,
            CompanyRequest.status == RequestStatus.PENDING,
        )
        .options(selectinload(CompanyRequest.user))
    )
    return list(result.scalars().all())


async def get_request_by_id(
    db: AsyncSession, request_id: uuid.UUID
) -> CompanyRequest | None:
    result = await db.execute(
        select(CompanyRequest).where(CompanyRequest.id == request_id)
    )
    return result.scalar_one_or_none()


async def update_company_fields(
    db: AsyncSession,
    company: Company,
    fields: dict,
) -> Company:
    if "name" in fields and fields["name"] is not None:
        company.name = fields["name"].strip()
    if "phone" in fields:
        phone = fields["phone"]
        company.phone = phone.strip() if isinstance(phone, str) and phone.strip() else None
    await db.commit()
    await db.refresh(company)
    return company
