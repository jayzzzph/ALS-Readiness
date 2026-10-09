"""unique content_id on content_evaluations

Revision ID: 0dc99b83b7e2
Revises: 7b0db1b8b8f4
Create Date: 2026-10-04 17:05:00.000000

M05 Phase 4 (content library).

content_evaluations gains UNIQUE (content_id): a content has at most one
evaluation. The upgrade checks for contents that already have more than one
first and stops with a list of them, rather than deleting any rows.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0dc99b83b7e2'
down_revision: Union[str, Sequence[str], None] = '7b0db1b8b8f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


UNIQUE_NAME = 'uq_content_evaluations_content_id'


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    duplicates = bind.execute(
        sa.text(
            """
            SELECT content_id, count(*) AS rows
            FROM content_evaluations
            GROUP BY content_id
            HAVING count(*) > 1
            ORDER BY content_id
            """
        )
    ).all()
    if duplicates:
        listed = "; ".join(
            f"content_id={content_id} ({rows} rows)" for content_id, rows in duplicates
        )
        raise RuntimeError(
            "content_evaluations has more than one evaluation for some contents, so "
            f"UNIQUE (content_id) cannot be added: {listed}. Remove the extra rows by "
            "hand, then run this revision again."
        )

    op.create_unique_constraint(UNIQUE_NAME, 'content_evaluations', ['content_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(UNIQUE_NAME, 'content_evaluations', type_='unique')
