from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class QuoteItemIn(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class QuoteRequest(BaseModel):
    items: list[QuoteItemIn]
    mode: Literal["COMPANY", "PRIVATE"] = "PRIVATE"


class LinePricingOut(BaseModel):
    product_id: UUID
    quantity: int
    base_price: Decimal
    company_pct: Decimal
    price_after_company: Decimal
    volume_pct: Decimal
    final_unit_price: Decimal
    effective_pct: Decimal
    line_total: Decimal


class QuoteOut(BaseModel):
    lines: list[LinePricingOut]
    subtotal_base: Decimal
    total_discount: Decimal
    grand_total: Decimal


class PricingTierOut(BaseModel):
    min_quantity: int
    discount_percentage: Decimal
    unit_price: Decimal


class ProductPricingOut(BaseModel):
    base_price: Decimal
    company_discount_percentage: Decimal
    unit_price: Decimal
    tiers: list[PricingTierOut]
