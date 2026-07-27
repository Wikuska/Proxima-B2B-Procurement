"""add company_id to orders

Revision ID: f2c8a91e4b70
Revises: a1b2c3d4e5f6
Create Date: 2026-07-23 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f2c8a91e4b70"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("company_id", sa.Uuid(), nullable=True),
    )
    op.create_index(op.f("ix_orders_company_id"), "orders", ["company_id"], unique=False)
    op.create_foreign_key(
        "fk_orders_company_id_companies",
        "orders",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    # Best-effort backfill for existing B2B orders from current user membership.
    op.execute(
        """
        UPDATE orders AS o
        SET company_id = u.company_id
        FROM users AS u
        WHERE o.user_id = u.id
          AND o.purchase_type = 'B2B'
          AND u.company_id IS NOT NULL
        """
    )

    orphan_count = op.get_bind().execute(
        sa.text(
            """
            SELECT COUNT(*) FROM orders
            WHERE purchase_type = 'B2B' AND company_id IS NULL
            """
        )
    ).scalar()
    if orphan_count:
        raise RuntimeError(
            f"Cannot add ck_orders_purchase_type_company_id: "
            f"{orphan_count} B2B order(s) still have NULL company_id "
            f"(placer left the company). Fix or delete those rows, then re-run."
        )

    op.create_check_constraint(
        "ck_orders_purchase_type_company_id",
        "orders",
        "(CAST(purchase_type AS TEXT) = 'B2B' AND company_id IS NOT NULL) "
        "OR (CAST(purchase_type AS TEXT) = 'B2C' AND company_id IS NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_orders_purchase_type_company_id", "orders", type_="check")
    op.drop_constraint("fk_orders_company_id_companies", "orders", type_="foreignkey")
    op.drop_index(op.f("ix_orders_company_id"), table_name="orders")
    op.drop_column("orders", "company_id")
