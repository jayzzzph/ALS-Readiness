"""merge m05 facilitator head with eeg sessions head

Revision ID: 182f60c85acf
Revises: 522e33fa0d57, f4e26e0a4e09
Create Date: 2026-10-09 22:22:54.366153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '182f60c85acf'
down_revision: Union[str, Sequence[str], None] = ('522e33fa0d57', 'f4e26e0a4e09')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
