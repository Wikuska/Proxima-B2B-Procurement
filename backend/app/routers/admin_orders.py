import uuid
from typing import Optional

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import User
from app.models.enums import OrderStatus
from app.schemas.admin_orders import AdminOrderDetailsOut, AdminOrderSummaryOut
from app.services import admin_orders as admin_orders_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/orders", response_model=list[AdminOrderSummaryOut])
async def list_admin_orders(
    status: Optional[OrderStatus] = Query(default=None),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """All platform orders (B2B + B2C) for fulfillment ops."""
    return await admin_orders_service.list_orders_for_admin(db, status)


@router.get("/orders/{order_id}", response_model=AdminOrderDetailsOut)
async def get_admin_order(
    order_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await admin_orders_service.get_order_for_admin(db, order_id)


@router.post("/orders/{order_id}/advance-status", response_model=AdminOrderDetailsOut)
async def advance_admin_order_status(
    order_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Advance fulfillment: PREPARING → SHIPPED → DELIVERED."""
    return await admin_orders_service.advance_order_status_for_admin(db, order_id)
