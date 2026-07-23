import uuid
from datetime import datetime
from decimal import Decimal

from app.models.enums import OrderStatus, PaymentMethod, PurchaseType, RequestStatus, UserRole
from app.schemas.order import BillingDocumentOut, OrderItemOut, ShipmentOut
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from typing_extensions import Annotated


def _strip_nip(v: object) -> str:
    if not isinstance(v, str):
        raise ValueError("NIP must be a string")
    return v.replace(" ", "").replace("-", "")


NipString = Annotated[
    str,
    BeforeValidator(_strip_nip),
    Field(pattern=r"^\d{10}$", description="10-digit Polish tax ID (NIP)"),
]


class CompanyRequestCreate(BaseModel):
    requested_nip: NipString


class RequesterMini(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class CompanyRequestOut(BaseModel):
    id: uuid.UUID
    requested_nip: str
    status: RequestStatus
    created_at: datetime
    reviewed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CompanyRequestAdminOut(CompanyRequestOut):
    user: RequesterMini


class CompanyAffiliationOut(BaseModel):
    company_name: str
    company_nip: str
    discount_percentage: Decimal
    role: UserRole
    joined_at: datetime | None


class CompanyMemberOut(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    role: UserRole
    company_joined_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CompanyOrderSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    company_id: uuid.UUID | None
    total_amount: Decimal
    created_at: datetime
    item_count: int
    placed_by: RequesterMini


class CompanyOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    company_id: uuid.UUID | None
    payment_method: PaymentMethod
    total_amount: Decimal
    note: str | None
    created_at: datetime
    billing_document: BillingDocumentOut
    shipment: ShipmentOut
    items: list[OrderItemOut]
    placed_by: RequesterMini
