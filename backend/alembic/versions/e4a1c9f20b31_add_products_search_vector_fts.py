"""add products search_vector for full-text search

Revision ID: e4a1c9f20b31
Revises: d8ded074f20f
Create Date: 2026-07-14 13:40:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "e4a1c9f20b31"
down_revision: Union[str, Sequence[str], None] = "d8ded074f20f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE products ADD COLUMN search_vector tsvector
          GENERATED ALWAYS AS (
            to_tsvector('simple', coalesce(name, '')) ||
            to_tsvector('simple', coalesce(sku, ''))
          ) STORED
        """
    )
    op.execute(
        "CREATE INDEX ix_products_search_vector ON products USING GIN (search_vector)"
    )


def downgrade() -> None:
    op.drop_index("ix_products_search_vector", table_name="products")
    op.drop_column("products", "search_vector")
