import uuid

from app.crud import product as product_crud
from app.database import get_db
from app.schemas import CategoryOut, PaginatedProductListOut, ProductDetailsOut
from app.schemas.product import ProductSnapshotOut
from app.services import catalog as catalog_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("/categories", response_model=list[CategoryOut])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Returns a list of all available categories to build tabs."""
    return await catalog_service.fetch_categories_for_menu(db)


@router.get(
    "/categories/{category_slug}/products", response_model=PaginatedProductListOut
)
async def get_products_by_category(
    category_slug: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(24, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """Returns a paginated list of products belonging ONLY to a specific category."""
    return await catalog_service.fetch_products_for_catalog(
        db, category_slug=category_slug, page=page, size=size
    )


@router.get("/products", response_model=PaginatedProductListOut)
async def get_all_products(
    search_query: str | None = Query(None, description="Search by name or sku"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(24, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """Returns a slimmed-down list of ALL products, useful for global text search."""
    return await catalog_service.fetch_products_for_catalog(
        db, search_query=search_query, page=page, size=size
    )


@router.get("/products/batch", response_model=list[ProductSnapshotOut])
async def get_products_batch(
    ids: str = Query(..., description="Comma-separated list of product UUIDs"),
    db: AsyncSession = Depends(get_db),
):
    """Returns product snapshots for the given IDs, including inactive ones (for guest cart hydration)."""
    try:
        parsed_ids = [uuid.UUID(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError:
        return []
    return await product_crud.get_products_by_ids(db, parsed_ids)


@router.get("/products/{product_slug}", response_model=ProductDetailsOut)
async def get_product_details(
    product_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns detailed information about a single product by its slug."""
    return await catalog_service.fetch_product_details(db, product_slug)
