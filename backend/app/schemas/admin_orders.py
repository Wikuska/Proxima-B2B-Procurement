import uuid
from datetime import datetime
from decimal import Decimal

from app.models.enums import OrderStatus, PaymentMethod, PurchaseType
from app.schemas.company import RequesterMini
from app.schemas.order import BillingDocumentOut, OrderItemOut, ShipmentOut
from pydantic import BaseModel, ConfigDict


class AdminOrderSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    company_id: uuid.UUID | None
    company_name: str | None = None
    total_amount: Decimal
    created_at: datetime
    item_count: int
    placed_by: RequesterMini


class AdminOrderDetailsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    company_id: uuid.UUID | None
    company_name: str | None = None
    payment_method: PaymentMethod
    total_amount: Decimal
    note: str | None
    created_at: datetime
    billing_document: BillingDocumentOut
    shipment: ShipmentOut
    items: list[OrderItemOut]
    placed_by: RequesterMini
