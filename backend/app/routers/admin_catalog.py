import uuid

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import User
from app.schemas.admin_catalog import (
    AdminProductDetailsOut,
    AdminProductListOut,
    AdminProductWriteIn,
)
from app.services import admin_catalog as admin_catalog_service
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/products", response_model=list[AdminProductListOut])
async def list_admin_products(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """All products including inactive — platform admin catalog table."""
    return await admin_catalog_service.list_products_for_admin(db)


@router.post(
    "/products",
    response_model=AdminProductDetailsOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_admin_product(
    data: AdminProductWriteIn,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a catalog product."""
    return await admin_catalog_service.create_product_for_admin(db, data)


@router.get("/products/{product_id}", response_model=AdminProductDetailsOut)
async def get_admin_product(
    product_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Single product detail for platform admin."""
    return await admin_catalog_service.get_product_for_admin(db, product_id)


@router.put("/products/{product_id}", response_model=AdminProductDetailsOut)
async def update_admin_product(
    product_id: uuid.UUID,
    data: AdminProductWriteIn,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing catalog product."""
    return await admin_catalog_service.update_product_for_admin(db, product_id, data)
