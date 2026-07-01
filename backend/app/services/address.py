import uuid

from app.core.exceptions import (
    AddressNotFoundException,
    DuplicateBillingAddressException,
    NotInCompanyException,
)
from app.crud import address as address_crud
from app.models.order import Address
from app.models.user import User
from app.schemas.address import AddressIn
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Personal addresses (owned by a user)
# ---------------------------------------------------------------------------


async def list_personal_addresses(db: AsyncSession, user: User) -> list[Address]:
    return await address_crud.get_user_addresses(db, user.id)


async def create_personal_address(db: AsyncSession, user: User, data: AddressIn) -> Address:
    address = await address_crud.create_address(db, data, user_id=user.id)
    await db.commit()
    return address


async def delete_personal_address(db: AsyncSession, user: User, address_id: uuid.UUID) -> None:
    address = await address_crud.get_address(db, address_id)
    if address is None or address.user_id != user.id:
        raise AddressNotFoundException()
    await address_crud.delete_address(db, address)
    await db.commit()


# ---------------------------------------------------------------------------
# Company addresses (owned by a company)
# ---------------------------------------------------------------------------


async def list_company_shipping_addresses(db: AsyncSession, user: User) -> list[Address]:
    """SHIPPING addresses visible to all company members (used in checkout address picker)."""
    if user.company_id is None:
        raise NotInCompanyException()
    return await address_crud.get_company_shipping_addresses(db, user.company_id)


async def get_company_billing_address(db: AsyncSession, user: User) -> Address | None:
    if user.company_id is None:
        raise NotInCompanyException()
    return await address_crud.get_company_billing_address(db, user.company_id)


async def create_company_address(db: AsyncSession, user: User, data: AddressIn) -> Address:
    # Caller already passed through require_company_admin; company_id is guaranteed.
    from sqlalchemy.exc import IntegrityError

    try:
        address = await address_crud.create_address(db, data, company_id=user.company_id)
        await db.commit()
        return address
    except IntegrityError:
        await db.rollback()
        raise DuplicateBillingAddressException()


async def delete_company_address(
    db: AsyncSession, user: User, address_id: uuid.UUID
) -> None:
    address = await address_crud.get_address(db, address_id)
    if address is None or address.company_id != user.company_id:
        raise AddressNotFoundException()
    await address_crud.delete_address(db, address)
    await db.commit()
