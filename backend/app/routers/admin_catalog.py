import uuid

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import User
from app.schemas.admin_catalog import AdminProductDetailsOut, AdminProductListOut
from app.services import admin_catalog as admin_catalog_service
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/products", response_model=list[AdminProductListOut])
async def list_admin_products(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """All products including inactive — platform admin catalog table."""
    return await admin_catalog_service.list_products_for_admin(db)


@router.get("/products/{product_id}", response_model=AdminProductDetailsOut)
async def get_admin_product(
    product_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Single product detail for platform admin (read-only in this slice)."""
    return await admin_catalog_service.get_product_for_admin(db, product_id)
