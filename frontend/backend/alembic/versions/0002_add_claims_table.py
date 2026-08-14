"""Add claims table for support tickets

Revision ID: 0002_claims
Revises: 0001_initial
Create Date: 2025-12-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_claims'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create claims table
    op.create_table(
        'claims',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=False),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('OPEN', 'IN_REVIEW', 'RESOLVED', name='claimstatus'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', sa.String(length=100), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_claims_id'), 'claims', ['id'], unique=False)
    op.create_index(op.f('ix_claims_user_id'), 'claims', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_claims_user_id'), table_name='claims')
    op.drop_index(op.f('ix_claims_id'), table_name='claims')
    op.drop_table('claims')
    sa.Enum('OPEN', 'IN_REVIEW', 'RESOLVED', name='claimstatus').drop(op.get_bind())
