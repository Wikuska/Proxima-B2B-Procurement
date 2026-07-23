"""add product_slug snapshot to order_items

Revision ID: b4d2e8f0a315
Revises: a9e3c7f1d204
Create Date: 2026-07-23 15:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4d2e8f0a315"
down_revision: Union[str, Sequence[str], None] = "a9e3c7f1d204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "order_items",
        sa.Column("product_slug", sa.String(length=255), nullable=True),
    )
    op.execute(
        """
        UPDATE order_items AS oi
        SET product_slug = p.slug
        FROM products AS p
        WHERE oi.product_id = p.id
        """
    )


def downgrade() -> None:
    op.drop_column("order_items", "product_slug")
