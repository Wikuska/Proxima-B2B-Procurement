import uuid
from datetime import datetime

from app.models.enums import UserRole
from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field
from typing_extensions import Annotated


def validate_password_strength(v: str) -> str:
    if not any(c.isupper() for c in v):
        raise ValueError("missing_uppercase")
    if not any(c.isdigit() for c in v):
        raise ValueError("missing_digit")
    return v


StrongPassword = Annotated[
    str, Field(min_length=8), AfterValidator(validate_password_strength)
]

NameString = Annotated[
    str,
    Field(
        min_length=2,
        max_length=50,
        pattern=r"^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$",
        description="Must contain only letters, spaces, or hyphens.",
    ),
]


# Data required to log a user in
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Fields shared across user schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: NameString
    last_name: NameString


# Data required to register a new user
class UserCreate(UserBase):
    password: StrongPassword


class EmailVerificationIn(BaseModel):
    email: EmailStr
    code: Annotated[str, Field(pattern=r"^\d{6}$")]


class ResendVerificationIn(BaseModel):
    email: EmailStr


class VerificationSessionIn(BaseModel):
    email: EmailStr


class VerificationSessionOut(BaseModel):
    resend_cooldown_seconds: int
    code_sent: bool
    is_verified: bool = False


# User profile returned in API responses
class UserOut(UserBase):
    id: uuid.UUID
    role: UserRole
    hide_b2b_prompts: bool
    company_id: uuid.UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Optional schema for future profile updates
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: StrongPassword | None = None
    first_name: NameString | None = None
    last_name: NameString | None = None
    hide_b2b_prompts: bool | None = None
