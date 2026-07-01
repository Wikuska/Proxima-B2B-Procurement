import re
import uuid

from app.models.enums import AddressType
from pydantic import BaseModel, ConfigDict, field_validator


class AddressIn(BaseModel):
    address_type: AddressType = AddressType.SHIPPING
    label: str | None = None
    street: str
    city: str
    postal_code: str
    country: str

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Postal code cannot be empty")
        if not re.match(r"^[A-Za-z0-9][A-Za-z0-9\s\-]{0,9}$", v):
            raise ValueError("Invalid postal code format")
        return v


class AddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    address_type: AddressType
    label: str | None
    street: str
    city: str
    postal_code: str
    country: str
    is_default: bool
