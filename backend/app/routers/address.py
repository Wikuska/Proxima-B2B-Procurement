import uuid

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.address import AddressIn, AddressOut
from app.services import address as address_service
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=list[AddressOut])
async def list_personal_addresses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await address_service.list_personal_addresses(db, user)


@router.post("", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
async def create_personal_address(
    payload: AddressIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await address_service.create_personal_address(db, user, payload)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personal_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await address_service.delete_personal_address(db, user, address_id)
