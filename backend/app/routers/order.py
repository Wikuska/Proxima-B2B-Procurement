import uuid
from typing import Optional

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.enums import PurchaseType
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderSummaryOut
from app.services import order as order_service
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.create_order(db, user, payload)


@router.get("", response_model=list[OrderSummaryOut])
async def list_orders(
    purchase_type: Optional[PurchaseType] = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.list_orders(db, user, purchase_type)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.get_order(db, user, order_id)
