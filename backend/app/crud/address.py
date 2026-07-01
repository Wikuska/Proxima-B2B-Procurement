import uuid

from app.models.enums import AddressType
from app.models.order import Address
from app.schemas.address import AddressIn
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_addresses(db: AsyncSession, user_id: uuid.UUID) -> list[Address]:
    stmt = (
        select(Address)
        .where(Address.user_id == user_id)
        .order_by(Address.is_default.desc(), Address.id)
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_company_addresses(db: AsyncSession, company_id: uuid.UUID) -> list[Address]:
    """All addresses for a company (SHIPPING + BILLING)."""
    stmt = (
        select(Address)
        .where(Address.company_id == company_id)
        .order_by(Address.address_type, Address.is_default.desc(), Address.id)
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_company_shipping_addresses(db: AsyncSession, company_id: uuid.UUID) -> list[Address]:
    stmt = (
        select(Address)
        .where(Address.company_id == company_id, Address.address_type == AddressType.SHIPPING)
        .order_by(Address.is_default.desc(), Address.id)
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_company_billing_address(db: AsyncSession, company_id: uuid.UUID) -> Address | None:
    stmt = select(Address).where(
        Address.company_id == company_id,
        Address.address_type == AddressType.BILLING,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_address(db: AsyncSession, address_id: uuid.UUID) -> Address | None:
    stmt = select(Address).where(Address.id == address_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_address(
    db: AsyncSession,
    data: AddressIn,
    *,
    user_id: uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
) -> Address:
    address = Address(
        user_id=user_id,
        company_id=company_id,
        address_type=data.address_type,
        label=data.label,
        street=data.street,
        city=data.city,
        postal_code=data.postal_code,
        country=data.country,
    )
    db.add(address)
    await db.flush()
    return address


async def delete_address(db: AsyncSession, address: Address) -> None:
    await db.delete(address)
    await db.flush()
