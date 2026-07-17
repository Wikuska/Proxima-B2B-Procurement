"""
Batch-embed catalog products into products.embedding.

From backend/ (venv active):

  pip install -r requirements-ai.txt
  # in .env: SEMANTIC_SEARCH_ENABLED=true
  python -m app.scripts.embed_products
  python -m app.scripts.embed_products --force   # re-embed all
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.product import Product
from app.services.embedding import build_product_embedding_text, embedding_service


async def embed_products(*, force: bool = False, batch_size: int = 32) -> int:
    if not embedding_service.is_available():
        print(
            "Embedding service unavailable.\n"
            "1) pip install -r requirements-ai.txt\n"
            "2) Set SEMANTIC_SEARCH_ENABLED=true in backend/.env\n"
            "3) Re-run this command (first run downloads the model ~120MB).",
            file=sys.stderr,
        )
        return 1

    async with AsyncSessionLocal() as db:
        stmt = (
            select(Product)
            .where(Product.is_active)
            .options(selectinload(Product.category))
            .order_by(Product.name)
        )
        if not force:
            stmt = stmt.where(Product.embedding.is_(None))

        products = list(await db.scalars(stmt))
        if not products:
            print("Nothing to embed (all active products already have embeddings).")
            return 0

        print(f"Embedding {len(products)} product(s)…")
        for start in range(0, len(products), batch_size):
            batch = products[start : start + batch_size]
            texts = [
                build_product_embedding_text(
                    product,
                    category_name=product.category.name if product.category else None,
                )
                for product in batch
            ]
            vectors = embedding_service.embed_texts(texts)
            for product, vector in zip(batch, vectors, strict=True):
                product.embedding = vector
            await db.commit()
            print(f"  saved {min(start + batch_size, len(products))}/{len(products)}")

    print("Done.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed catalog products for hybrid search")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-embed products that already have an embedding",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="How many products to encode per model call",
    )
    args = parser.parse_args()
    raise SystemExit(
        asyncio.run(embed_products(force=args.force, batch_size=args.batch_size))
    )


if __name__ == "__main__":
    main()
