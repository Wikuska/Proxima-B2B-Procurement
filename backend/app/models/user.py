import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import UserRole

if TYPE_CHECKING:
    from .company import Company, CompanyRequest
    from .order import Order

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    
    # Flags and status
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False) # Double Opt-in
    is_active: Mapped[bool] = mapped_column(Boolean, default=True) # Soft Delete
    hide_b2b_prompts: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relations
    company: Mapped["Company | None"] = relationship(back_populates="users")
    company_requests: Mapped[List["CompanyRequest"]] = relationship(back_populates="user")
    orders: Mapped[List["Order"]] = relationship(back_populates="user")