"""add pgvector extension and products.embedding

Revision ID: a1b2c3d4e5f6
Revises: e4a1c9f20b31
Create Date: 2026-07-17 15:10:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e4a1c9f20b31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIMENSIONS = 384


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute(
        f"ALTER TABLE products ADD COLUMN embedding vector({EMBEDDING_DIMENSIONS})"
    )
    # Cosine distance ops — matches <=> queries used by hybrid search.
    op.execute(
        """
        CREATE INDEX ix_products_embedding_hnsw
        ON products
        USING hnsw (embedding vector_cosine_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_embedding_hnsw")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS embedding")
    # Leave the extension installed — other DBs/objects may depend on it.
