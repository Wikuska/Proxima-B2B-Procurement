from uuid import UUID

from app.database import get_db
from app.schemas import CategoryOut, PaginatedProductListOut
from app.services import catalog as catalog_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("/categories", response_model=list[CategoryOut])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Returns a list of all available categories to build tabs."""
    return await catalog_service.fetch_categories_for_menu(db)


@router.get("/products", response_model=PaginatedProductListOut)
async def get_products(
    category_id: UUID | None = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(24, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """Returns a slimmed-down list of products. If a category_id is provided, filters the results."""
    return await catalog_service.fetch_products_for_catalog(
        db, category_id=category_id, page=page, size=size
    )
