"""add at_risk_flags

Revision ID: c4e1a9f27b3d
Revises: 0dc99b83b7e2
Create Date: 2026-10-05 09:00:00.000000

M05 Phase 6 (at-risk flags).

New table at_risk_flags with two new enum types, at_risk_reason and
at_risk_flag_status. Timestamps follow the convention already used by cohorts,
users, and contents: timestamp without time zone, holding UTC.

uq_at_risk_flags_active_learner_cohort_reason_strand allows at most one active
flag (open or reviewed) per learner, cohort, reason, and strand. strand_id is
null for every reason but low_mps, and nulls never collide in a unique index,
so it is indexed as COALESCE(strand_id, 0); strand ids start at 1.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c4e1a9f27b3d'
down_revision: Union[str, Sequence[str], None] = '0dc99b83b7e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE = 'at_risk_flags'
ACTIVE_UNIQUE_NAME = 'uq_at_risk_flags_active_learner_cohort_reason_strand'
COHORT_STATUS_INDEX_NAME = 'ix_at_risk_flags_cohort_id_status'

# Created and dropped explicitly below, so the table does not create them.
reason_enum = postgresql.ENUM(
    'low_mps', 'inactive', 'low_readiness',
    name='at_risk_reason',
    create_type=False,
)
status_enum = postgresql.ENUM(
    'open', 'reviewed', 'dismissed', 'resolved',
    name='at_risk_flag_status',
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    reason_enum.create(bind, checkfirst=True)
    status_enum.create(bind, checkfirst=True)

    op.create_table(
        TABLE,
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('learner_id', sa.Integer(), nullable=False),
        sa.Column('cohort_id', sa.Integer(), nullable=False),
        sa.Column('reason', reason_enum, nullable=False),
        sa.Column('strand_id', sa.Integer(), nullable=True),
        sa.Column('trigger_value', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('status', status_enum, server_default='open', nullable=False),
        sa.Column('detected_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name='at_risk_flags_pkey'),
        sa.ForeignKeyConstraint(['learner_id'], ['learners.id'], name='at_risk_flags_learner_id_fkey'),
        sa.ForeignKeyConstraint(['cohort_id'], ['cohorts.id'], name='at_risk_flags_cohort_id_fkey'),
        sa.ForeignKeyConstraint(['strand_id'], ['learning_strands.id'], name='at_risk_flags_strand_id_fkey'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], name='at_risk_flags_reviewed_by_fkey'),
    )

    op.create_index(
        ACTIVE_UNIQUE_NAME,
        TABLE,
        ['learner_id', 'cohort_id', 'reason', sa.text('COALESCE(strand_id, 0)')],
        unique=True,
        postgresql_where=sa.text("status IN ('open', 'reviewed')"),
    )
    op.create_index(COHORT_STATUS_INDEX_NAME, TABLE, ['cohort_id', 'status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(COHORT_STATUS_INDEX_NAME, table_name=TABLE)
    op.drop_index(
        ACTIVE_UNIQUE_NAME,
        table_name=TABLE,
        postgresql_where=sa.text("status IN ('open', 'reviewed')"),
    )
    op.drop_table(TABLE)

    bind = op.get_bind()
    status_enum.drop(bind, checkfirst=True)
    reason_enum.drop(bind, checkfirst=True)
