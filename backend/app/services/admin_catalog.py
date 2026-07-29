from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ProductNotFoundException
from app.crud import product as product_crud


async def list_products_for_admin(db: AsyncSession):
    return await product_crud.get_all_products_for_admin(db)


async def get_product_for_admin(db: AsyncSession, product_id: UUID):
    product = await product_crud.get_product_for_admin(db, product_id)
    if product is None:
        raise ProductNotFoundException()
    return product
