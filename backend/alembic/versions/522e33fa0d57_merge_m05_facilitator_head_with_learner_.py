"""merge M05 facilitator head with learner content progress head

Revision ID: 522e33fa0d57
Revises: c4e1a9f27b3d, 87f2a9433e0b
Create Date: 2026-10-09 11:43:18.665225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '522e33fa0d57'
down_revision: Union[str, Sequence[str], None] = ('c4e1a9f27b3d', '87f2a9433e0b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
