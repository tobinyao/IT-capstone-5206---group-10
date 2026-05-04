#!/usr/bin/env python3
"""Initialise the local SQLite database for the backend."""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "firewatch.sqlite"
SCHEMA_PATH = BACKEND_DIR / "database" / "schema.sql"


def ensure_column(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = {
        row[1]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )


def apply_lightweight_migrations(connection: sqlite3.Connection) -> None:
    ensure_column(connection, "heritage_sites", "properties_json", "TEXT")
    ensure_column(connection, "burn_options", "properties_json", "TEXT")
    ensure_column(connection, "granite_polygons", "properties_json", "TEXT")


def initialise_database(db_path: Path, schema_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    schema_sql = schema_path.read_text(encoding="utf-8")

    with sqlite3.connect(db_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(schema_sql)
        apply_lightweight_migrations(connection)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create the FireWatch SQLite database schema."
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=DEFAULT_DB_PATH,
        help=f"SQLite database path. Defaults to {DEFAULT_DB_PATH}",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=SCHEMA_PATH,
        help=f"Schema SQL path. Defaults to {SCHEMA_PATH}",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    initialise_database(args.db, args.schema)
    print(f"SQLite schema initialised at {args.db}")


if __name__ == "__main__":
    main()
