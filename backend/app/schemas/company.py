import uuid
from datetime import datetime

from app.models.enums import RequestStatus
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
