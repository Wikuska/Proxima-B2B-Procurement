"""order status: drop PAID, rename PROCESSING to PREPARING

Revision ID: a9e3c7f1d204
Revises: f2c8a91e4b70
Create Date: 2026-07-23 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "a9e3c7f1d204"
down_revision: Union[str, Sequence[str], None] = "f2c8a91e4b70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Postgres cannot drop/rename enum values in place safely — recreate the type.
    op.execute("ALTER TYPE orderstatus RENAME TO orderstatus_old")
    op.execute(
        "CREATE TYPE orderstatus AS ENUM ("
        "'PENDING_PAYMENT', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'"
        ")"
    )
    op.execute(
        """
        ALTER TABLE orders
        ALTER COLUMN status TYPE orderstatus
        USING (
            CASE status::text
                WHEN 'PAID' THEN 'PREPARING'
                WHEN 'PROCESSING' THEN 'PREPARING'
                ELSE status::text
            END
        )::orderstatus
        """
    )
    op.execute("DROP TYPE orderstatus_old")


def downgrade() -> None:
    op.execute("ALTER TYPE orderstatus RENAME TO orderstatus_old")
    op.execute(
        "CREATE TYPE orderstatus AS ENUM ("
        "'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', "
        "'CANCELLED', 'RETURNED'"
        ")"
    )
    op.execute(
        """
        ALTER TABLE orders
        ALTER COLUMN status TYPE orderstatus
        USING (
            CASE status::text
                WHEN 'PREPARING' THEN 'PROCESSING'
                ELSE status::text
            END
        )::orderstatus
        """
    )
    op.execute("DROP TYPE orderstatus_old")
