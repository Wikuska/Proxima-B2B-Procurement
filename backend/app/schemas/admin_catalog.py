from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AdminProductCategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class AdminVolumeDiscountOut(BaseModel):
    min_quantity: int
    discount_percentage: Decimal

    model_config = ConfigDict(from_attributes=True)


class AdminVolumeDiscountIn(BaseModel):
    min_quantity: int = Field(ge=1)
    discount_percentage: Decimal = Field(gt=0, le=100, decimal_places=2, max_digits=5)


class AdminProductListOut(BaseModel):
    id: UUID
    name: str
    slug: str
    sku: str
    base_price: Decimal
    stock_quantity: int
    is_active: bool
    is_b2b_only: bool
    category: AdminProductCategoryOut

    model_config = ConfigDict(from_attributes=True)


class AdminProductDetailsOut(AdminProductListOut):
    description: str | None
    main_image_url: str | None
    volume_discounts: list[AdminVolumeDiscountOut] = []


class AdminProductWriteIn(BaseModel):
    """Shared body for create and update. Slug is always derived from name server-side."""

    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    category_id: UUID
    description: str | None = None
    base_price: Decimal = Field(gt=0, decimal_places=2, max_digits=10)
    stock_quantity: int = Field(ge=0)
    main_image_url: str | None = None
    is_active: bool = True
    is_b2b_only: bool = False
    volume_discounts: list[AdminVolumeDiscountIn] = []

    @model_validator(mode="after")
    def unique_min_quantities(self) -> "AdminProductWriteIn":
        quantities = [tier.min_quantity for tier in self.volume_discounts]
        if len(quantities) != len(set(quantities)):
            raise ValueError("Volume discount tiers must have unique min quantities")
        return self
