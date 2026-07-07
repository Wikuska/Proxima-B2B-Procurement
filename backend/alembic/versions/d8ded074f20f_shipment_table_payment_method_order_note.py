"""shipment table, payment method, order note

Revision ID: d8ded074f20f
Revises: c08b7b1b873e
Create Date: 2026-07-07 11:40:17.276815

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8ded074f20f'
down_revision: Union[str, Sequence[str], None] = 'c08b7b1b873e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    deliverymethod = sa.Enum(
        'COURIER', 'COURIER_EXPRESS', 'INPOST_LOCKER', 'PICKUP', name='deliverymethod'
    )
    paymentmethod = sa.Enum(
        'BANK_TRANSFER', 'CARD', 'BLIK', 'CASH_ON_DELIVERY', 'DEFERRED', name='paymentmethod'
    )
    paymentmethod.create(op.get_bind())

    op.create_table('shipments',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('order_id', sa.Uuid(), nullable=False),
    sa.Column('delivery_method', deliverymethod, nullable=False),
    sa.Column('shipping_cost', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('recipient_name', sa.String(length=200), nullable=False),
    sa.Column('recipient_phone', sa.String(length=30), nullable=False),
    sa.Column('recipient_email', sa.String(length=255), nullable=True),
    sa.Column('shipping_street', sa.String(length=255), nullable=False),
    sa.Column('shipping_city', sa.String(length=100), nullable=False),
    sa.Column('shipping_postal_code', sa.String(length=20), nullable=False),
    sa.Column('shipping_country', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('order_id')
    )
    op.add_column('orders', sa.Column(
        'payment_method', paymentmethod, nullable=False, server_default='BANK_TRANSFER',
    ))
    op.alter_column('orders', 'payment_method', server_default=None)
    op.add_column('orders', sa.Column('note', sa.Text(), nullable=True))
    op.drop_column('orders', 'shipping_street')
    op.drop_column('orders', 'shipping_postal_code')
    op.drop_column('orders', 'shipping_country')
    op.drop_column('orders', 'shipping_city')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('orders', sa.Column('shipping_city', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
    op.add_column('orders', sa.Column('shipping_country', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
    op.add_column('orders', sa.Column('shipping_postal_code', sa.VARCHAR(length=20), autoincrement=False, nullable=False))
    op.add_column('orders', sa.Column('shipping_street', sa.VARCHAR(length=255), autoincrement=False, nullable=False))
    op.drop_column('orders', 'note')
    op.drop_column('orders', 'payment_method')
    op.drop_table('shipments')
    sa.Enum(name='paymentmethod').drop(op.get_bind())
    sa.Enum(name='deliverymethod').drop(op.get_bind())
