from pydantic import BaseModel


class PublicConfigOut(BaseModel):
    portfolio_mode: bool
    portfolio_verification_code: str | None = None
