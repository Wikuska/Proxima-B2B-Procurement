from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .product import ProductSnapshotOut


class CartItemIn(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartMergeItem(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    product: ProductSnapshotOut
    quantity: int

    model_config = ConfigDict(from_attributes=True)
