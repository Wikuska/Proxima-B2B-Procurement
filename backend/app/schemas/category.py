from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)
