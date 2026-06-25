from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProductListOut(BaseModel):
    id: UUID
    name: str
    slug: str
    sku: str
    base_price: Decimal
    stock_quantity: int
    main_image_url: str | None
    is_b2b_only: bool

    model_config = ConfigDict(from_attributes=True)


class PaginatedProductListOut(BaseModel):
    items: list[ProductListOut]
    total: int  # Number of all found products
    page: int  # Current page
    size: int  # Number of products on one page
    pages: int  # Number of all existing pages


class ProductVolumeDiscountOut(BaseModel):
    min_quantity: int
    discount_percentage: Decimal

    model_config = ConfigDict(from_attributes=True)


class ProductDetailsOut(ProductListOut):
    description: str | None
    is_active: bool
    volume_discounts: list[ProductVolumeDiscountOut] = []
