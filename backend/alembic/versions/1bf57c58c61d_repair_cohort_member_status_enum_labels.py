"""repair cohort_member_status enum labels

Revision ID: 1bf57c58c61d
Revises: 5b7680c500b9
Create Date: 2026-10-02 19:36:55.445321

Why this exists: revision 34796771c816 (the initial schema) was edited in place
on 2026-09-21 (commit f44a692b2). It originally created the enum
cohort_member_status with the labels ('active', 'completed', 'withdrawn'); the
edit changed them to ('active', 'ended'), which is what the code expects.

Alembic tracks revisions by id, not by content, so a database that had already
run 34796771c816 before that date kept the old labels and still reports itself
as up to date. On such a database the value 'ended' is rejected, so ending a
cohort membership or a facilitator assignment fails.

This revision brings those databases in line. It reads the labels first and
does nothing when they are already ('active', 'ended'), so it is a no-op on a
database built from the current files and is safe to run more than once.

Where a repair is needed it swaps the type rather than adding a value: it
renames the old type, creates the correct one, and converts the two status
columns, mapping 'active' to 'active' and every other value to 'ended'. No
ALTER TYPE ... ADD VALUE is used, so the whole revision runs in one transaction.
"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1bf57c58c61d'
down_revision: Union[str, Sequence[str], None] = '5b7680c500b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TYPE_NAME = 'cohort_member_status'
OLD_TYPE_NAME = 'cohort_member_status_old'
CORRECT_LABELS = ['active', 'ended']
# The two columns that use the type.
STATUS_TABLES = ('cohort_learners', 'cohort_facilitators')
# The only index whose definition mentions the type (its WHERE clause).
INDEX_NAME = 'one_active_cohort_per_learner'

SCHEMA_OID = "(SELECT oid FROM pg_namespace WHERE nspname = current_schema())"


def _current_labels(bind) -> list[str]:
    rows = bind.execute(
        sa.text(
            f"""
            SELECT e.enumlabel
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = :name AND t.typnamespace = {SCHEMA_OID}
            ORDER BY e.enumsortorder
            """
        ),
        {"name": TYPE_NAME},
    )
    return [row[0] for row in rows]


def _status_defaults(bind) -> dict[str, str]:
    """Server default of each status column, as {table: expression}. Empty when there is none."""
    rows = bind.execute(
        sa.text(
            f"""
            SELECT c.relname, pg_get_expr(d.adbin, d.adrelid)
            FROM pg_attrdef d
            JOIN pg_class c ON c.oid = d.adrelid
            JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
            WHERE c.relname IN :tables AND a.attname = 'status'
              AND c.relnamespace = {SCHEMA_OID}
            """
        ).bindparams(sa.bindparam("tables", expanding=True)),
        {"tables": list(STATUS_TABLES)},
    )
    return {table: expression for table, expression in rows}


def _unexpected_dependents(bind) -> list[str]:
    """Objects that depend on the type other than the ones this revision handles.

    Handled: the two status columns, their defaults, the partial unique index,
    and the type's own array type. Anything else (a view, a function, another
    column) would be broken by the swap, so the caller stops instead.
    """
    rows = bind.execute(
        sa.text(
            f"""
            SELECT d.classid::regclass::text AS catalog,
                   d.objsubid,
                   pg_describe_object(d.classid, d.objid, d.objsubid) AS description,
                   COALESCE(col_table.relname, def_table.relname) AS table_name,
                   COALESCE(col.attname, def_col.attname) AS column_name,
                   rel.relname AS relation_name,
                   typ.typname AS type_name
            FROM pg_depend d
            LEFT JOIN pg_class rel
                   ON d.classid = 'pg_class'::regclass AND d.objsubid = 0 AND rel.oid = d.objid
            LEFT JOIN pg_class col_table
                   ON d.classid = 'pg_class'::regclass AND d.objsubid > 0 AND col_table.oid = d.objid
            LEFT JOIN pg_attribute col
                   ON col.attrelid = col_table.oid AND col.attnum = d.objsubid
            LEFT JOIN pg_type typ
                   ON d.classid = 'pg_type'::regclass AND typ.oid = d.objid
            LEFT JOIN pg_attrdef def
                   ON d.classid = 'pg_attrdef'::regclass AND def.oid = d.objid
            LEFT JOIN pg_class def_table ON def_table.oid = def.adrelid
            LEFT JOIN pg_attribute def_col
                   ON def_col.attrelid = def.adrelid AND def_col.attnum = def.adnum
            WHERE d.refclassid = 'pg_type'::regclass
              AND d.refobjid = (
                  SELECT t.oid FROM pg_type t
                  WHERE t.typname = :name AND t.typnamespace = {SCHEMA_OID}
              )
            """
        ),
        {"name": TYPE_NAME},
    ).mappings()

    unexpected = []
    for row in rows:
        is_status_column = row["table_name"] in STATUS_TABLES and row["column_name"] == "status"
        handled = (
            (row["catalog"] in ("pg_class", "pg_attrdef") and is_status_column)
            or (row["catalog"] == "pg_class" and row["relation_name"] == INDEX_NAME)
            or (row["catalog"] == "pg_type" and row["type_name"] == f"_{TYPE_NAME}")
        )
        if not handled:
            unexpected.append(row["description"])

    return unexpected


def _mapped_default(expression: str) -> str:
    """The label a status default should have after the repair.

    Only a plain label default (e.g. 'active'::cohort_member_status) is
    understood; it is mapped with the same rule as the rows.
    """
    match = re.fullmatch(r"'([^']*)'::\S+", expression.strip())
    if match is None:
        raise RuntimeError(
            f"Cannot carry over the server default {expression!r} on a status column. "
            "Review it by hand before running this revision."
        )

    return "active" if match.group(1) == "active" else "ended"


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    labels = _current_labels(bind)
    if labels == CORRECT_LABELS:
        # Built from the current files, or already repaired. Nothing to do.
        return

    if not labels:
        raise RuntimeError(f"Enum type {TYPE_NAME} was not found; cannot repair it.")

    unexpected = _unexpected_dependents(bind)
    if unexpected:
        raise RuntimeError(
            f"Other objects depend on {TYPE_NAME} and would be broken by the repair: "
            + "; ".join(unexpected)
            + ". Handle them by hand, then run this revision again."
        )

    # No migration and no model sets a server default on either status column,
    # but carry one over if a database has it. Validated before anything changes.
    defaults = {
        table: _mapped_default(expression)
        for table, expression in _status_defaults(bind).items()
    }

    # The index's WHERE clause is typed to the old enum, so it has to go first.
    op.execute(f"DROP INDEX IF EXISTS {INDEX_NAME}")

    for table in defaults:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN status DROP DEFAULT")

    op.execute(f"ALTER TYPE {TYPE_NAME} RENAME TO {OLD_TYPE_NAME}")
    op.execute(f"CREATE TYPE {TYPE_NAME} AS ENUM ('active', 'ended')")

    # 'active' stays 'active'; every other old label ('completed', 'withdrawn')
    # becomes 'ended'.
    for table in STATUS_TABLES:
        op.execute(
            f"""
            ALTER TABLE {table}
            ALTER COLUMN status TYPE {TYPE_NAME}
            USING (
                CASE WHEN status::text = 'active' THEN 'active' ELSE 'ended' END
            )::{TYPE_NAME}
            """
        )

    for table, label in defaults.items():
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN status SET DEFAULT '{label}'::{TYPE_NAME}"
        )

    # Same definition as in 34796771c816, on the table's current name
    # (cohort_members was renamed to cohort_learners by d92cf08e73fd).
    op.create_index(
        INDEX_NAME,
        'cohort_learners',
        ['learner_id'],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    op.execute(f"DROP TYPE {OLD_TYPE_NAME}")


def downgrade() -> None:
    """Downgrade schema."""
    # Deliberately a no-op. The only thing to undo would be the repair itself:
    # putting back the labels ('active', 'completed', 'withdrawn') would make
    # the database reject 'ended' again, which is the fault this revision fixes.
    pass
