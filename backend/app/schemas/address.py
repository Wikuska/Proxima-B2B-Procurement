import uuid

from pydantic import BaseModel, ConfigDict


class AddressIn(BaseModel):
    label: str | None = None
    street: str
    city: str
    postal_code: str
    country: str


class AddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str | None
    street: str
    city: str
    postal_code: str
    country: str
    is_default: bool
