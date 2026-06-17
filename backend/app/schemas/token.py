from app.models.enums import UserRole
from pydantic import BaseModel


# Standardowa struktura odpowiedzi JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Dane zaszyfrowane wewnątrz tokenu
class TokenData(BaseModel):
    # 'sub' to subject, ID użytkownika zamienione na string
    sub: str | None = None
    role: UserRole | None = None
