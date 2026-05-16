from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

import pytest


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app as app_module  # noqa: E402


@pytest.fixture()
def client():
    app_module.app.config.update(TESTING=True)
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture()
def seeded_backend_db(monkeypatch, tmp_path):
    """Seed a temporary SQLite DB and route services.data_loader calls to it."""

    import services.data_loader as data_loader

    root_dir = Path(__file__).resolve().parents[2]
    schema_path = root_dir / "backend" / "database" / "schema.sql"
    schema_sql = schema_path.read_text(encoding="utf-8")

    db_path = tmp_path / "firewatch.test.sqlite"
    connection = sqlite3.connect(db_path)
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(schema_sql)

    connection.execute(
        "INSERT INTO users (id, email, role) VALUES (?, ?, ?)",
        (1, "test@firewatch.local", "admin"),
    )

    site_id = "site-1"
    identifier_id = "heritage-identifier-1"
    geometry = {"type": "Point", "coordinates": [151.0, -33.0]}
    properties = {"identifier": site_id, "name": "Test Site"}
    connection.execute(
        """
        INSERT INTO heritage_sites (
            id,
            identifier,
            name,
            source,
            data_source,
            geometry_json,
            properties_json,
            latitude,
            longitude,
            heritage_type,
            fuel_class,
            slope_degrees,
            vulnerability_score,
            vulnerability_level,
            assessed_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            site_id,
            site_id,
            "Test Heritage Site",
            "register",
            "DPLH_099",
            json.dumps(geometry, separators=(",", ":")),
            json.dumps(properties, separators=(",", ":")),
            -33.0,
            151.0,
            "Historic",
            "Forest",
            10.0,
            25.0,
            "Low",
            "2026-01-01",
            1,
        ),
    )

    second_geometry = {"type": "Point", "coordinates": [150.5, -33.5]}
    second_properties = {"identifier": identifier_id, "name": "Identifier Site"}
    connection.execute(
        """
        INSERT INTO heritage_sites (
            id,
            identifier,
            name,
            source,
            data_source,
            geometry_json,
            properties_json,
            latitude,
            longitude,
            heritage_type,
            fuel_class,
            slope_degrees,
            vulnerability_score,
            vulnerability_level,
            assessed_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "site-2",
            identifier_id,
            "Identifier Heritage Site",
            "register",
            "DPLH_099",
            json.dumps(second_geometry, separators=(",", ":")),
            json.dumps(second_properties, separators=(",", ":")),
            -33.5,
            150.5,
            "Historic",
            "Forest",
            12.0,
            30.0,
            "Medium",
            "2026-01-02",
            1,
        ),
    )

    connection.execute(
        """
        INSERT INTO geojson_features (
            layer_name,
            feature_index,
            feature_id,
            geometry_json,
            properties_json,
            source_path
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            "burn_options",
            0,
            "burn-1",
            json.dumps(
                {"type": "Point", "coordinates": [151.1, -33.1]},
                separators=(",", ":"),
            ),
            json.dumps({"burnid": "burn-1", "name": "Test Burn"}, separators=(",", ":")),
            "test://seed",
        ),
    )

    processed_metadata = {"version": "test", "generated_at": "2026-01-01T00:00:00Z"}
    connection.execute(
        "INSERT INTO app_metadata (key, value_json, source_path) VALUES (?, ?, ?)",
        ("processed_metadata", json.dumps(processed_metadata, separators=(",", ":")), "test://seed"),
    )

    connection.commit()
    connection.close()

    def _patched_get_db_connection(db_path_override=None):
        patched = sqlite3.connect(db_path)
        patched.row_factory = sqlite3.Row
        patched.execute("PRAGMA foreign_keys = ON")
        return patched

    monkeypatch.setattr(data_loader, "get_db_connection", _patched_get_db_connection)

    return {
        "db_path": db_path,
        "site_id": site_id,
        "identifier_id": identifier_id,
        "processed_metadata": processed_metadata,
    }


@pytest.fixture()
def seeded_backend_db_no_metadata(seeded_backend_db):
    """Provide a seeded DB without processed metadata for 404 tests."""

    db_path = seeded_backend_db["db_path"]
    with sqlite3.connect(db_path) as connection:
        connection.execute(
            "DELETE FROM app_metadata WHERE key = ?",
            ("processed_metadata",),
        )
        connection.commit()

    return seeded_backend_db
