from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AdminProductCategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


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
