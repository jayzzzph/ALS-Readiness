"""add created_by and timestamps to modules and lessons, unique cohort_content

Revision ID: 7b0db1b8b8f4
Revises: 1bf57c58c61d
Create Date: 2026-10-04 14:16:03.283461

M05 Phase 3 (curriculum authoring and content assignment).

modules and lessons gain created_by (nullable FK to users.id), created_at, and
updated_at. The timestamps follow the convention already used by cohorts,
users, and contents: timestamp without time zone, nullable, server default
now(). Adding the columns with that default fills existing rows with the time
this revision runs; created_by stays null for them.

cohort_content gains UNIQUE (cohort_id, content_id). The upgrade checks for
existing duplicate assignments first and stops with a list of them, rather than
deleting any rows.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b0db1b8b8f4'
down_revision: Union[str, Sequence[str], None] = '1bf57c58c61d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


STRUCTURE_TABLES = ('modules', 'lessons')
UNIQUE_NAME = 'uq_cohort_content_cohort_content'


def _created_by_fk(table: str) -> str:
    # PostgreSQL's default constraint name, given explicitly so the downgrade can drop it.
    return f'{table}_created_by_fkey'


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    duplicates = bind.execute(
        sa.text(
            """
            SELECT cohort_id, content_id, count(*) AS rows
            FROM cohort_content
            GROUP BY cohort_id, content_id
            HAVING count(*) > 1
            ORDER BY cohort_id, content_id
            """
        )
    ).all()
    if duplicates:
        listed = "; ".join(
            f"cohort_id={cohort_id} content_id={content_id} ({rows} rows)"
            for cohort_id, content_id, rows in duplicates
        )
        raise RuntimeError(
            "cohort_content has duplicate assignments, so UNIQUE (cohort_id, content_id) "
            f"cannot be added: {listed}. Remove the extra rows by hand, then run this "
            "revision again."
        )

    for table in STRUCTURE_TABLES:
        op.add_column(table, sa.Column('created_by', sa.Integer(), nullable=True))
        op.add_column(table, sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True))
        op.add_column(table, sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True))
        op.create_foreign_key(_created_by_fk(table), table, 'users', ['created_by'], ['id'])

    op.create_unique_constraint(UNIQUE_NAME, 'cohort_content', ['cohort_id', 'content_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(UNIQUE_NAME, 'cohort_content', type_='unique')

    for table in reversed(STRUCTURE_TABLES):
        op.drop_constraint(_created_by_fk(table), table, type_='foreignkey')
        op.drop_column(table, 'updated_at')
        op.drop_column(table, 'created_at')
        op.drop_column(table, 'created_by')
