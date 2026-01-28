"""Add passage_number column with backfill

Revision ID: 001_passage_number
Revises:
Create Date: 2026-01-28 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '001_passage_number'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add passage_number column and backfill existing data."""

    # For SQLite, we need to use batch operations
    with op.batch_alter_table('passages', schema=None) as batch_op:
        # Step 1: Add passage_number column as nullable
        batch_op.add_column(sa.Column('passage_number', sa.Integer(), nullable=True))

    # Step 2: Backfill existing passages with sequential numbers per story
    # Get connection for data manipulation
    conn = op.get_bind()

    # Get all stories
    stories = conn.execute(text("SELECT id FROM stories")).fetchall()

    # For each story, assign passage numbers based on created_at order
    for story_row in stories:
        story_id = story_row[0]

        # Get passages for this story ordered by created_at
        passages = conn.execute(
            text("""
                SELECT id
                FROM passages
                WHERE story_id = :story_id
                ORDER BY created_at ASC
            """),
            {"story_id": story_id}
        ).fetchall()

        # Assign sequential numbers
        for idx, passage_row in enumerate(passages, start=1):
            passage_id = passage_row[0]
            conn.execute(
                text("""
                    UPDATE passages
                    SET passage_number = :number
                    WHERE id = :id
                """),
                {"number": idx, "id": passage_id}
            )

    # Commit the backfill
    conn.commit()

    # Step 3: Add unique constraint on (story_id, passage_number)
    with op.batch_alter_table('passages', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'uq_passage_story_number',
            ['story_id', 'passage_number']
        )


def downgrade() -> None:
    """Remove passage_number column and constraint."""

    with op.batch_alter_table('passages', schema=None) as batch_op:
        # Remove unique constraint
        batch_op.drop_constraint('uq_passage_story_number', type_='unique')

        # Remove column
        batch_op.drop_column('passage_number')
