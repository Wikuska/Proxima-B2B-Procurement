from typing import Literal

from app.core.dependencies import get_optional_current_user
from app.database import get_db
from app.models import User
from app.schemas.pricing import ProductPricingOut, QuoteOut, QuoteRequest
from app.services import pricing as pricing_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.post("/quote", response_model=QuoteOut)
async def quote_cart(
    request: QuoteRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
):
    """Prices a list of cart items applying company and volume discounts."""
    return await pricing_service.process_quote(db, request, user)


@router.get("/product/{product_slug}", response_model=ProductPricingOut)
async def get_product_pricing(
    product_slug: str,
    mode: Literal["COMPANY", "PRIVATE"] = Query("PRIVATE"),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
):
    """Returns authoritative per-unit price and tier prices for a product."""
    return await pricing_service.get_product_pricing_data(db, product_slug, mode, user)
