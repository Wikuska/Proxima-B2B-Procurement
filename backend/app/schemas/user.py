import uuid
from datetime import datetime

from app.models.enums import UserRole
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# Dane potrzebne do logowania użytkownika
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Wspólne pola dla użytkownika
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)


# Dane potrzebne do rejestracji nowego użytkownika
class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("missing_uppercase")
        if not any(c.isdigit() for c in v):
            raise ValueError("missing_digit")
        return v


# Profil użytkownika zwracany w odpowiedzi API
class UserOut(UserBase):
    id: uuid.UUID
    role: UserRole
    is_verified: bool
    is_active: bool
    hide_b2b_prompts: bool
    company_id: uuid.UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Opcjonalne schematy do aktualizacji profilu w przyszłości
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8)
    first_name: str | None = Field(None, min_length=2, max_length=100)
    last_name: str | None = Field(None, min_length=2, max_length=100)
    hide_b2b_prompts: bool | None = None
