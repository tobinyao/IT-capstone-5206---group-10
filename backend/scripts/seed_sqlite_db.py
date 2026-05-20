#!/usr/bin/env python3
"""Seed the local SQLite database from processed GeoJSON files."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any

from werkzeug.security import generate_password_hash


BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent
PUBLIC_PROCESSED_DIR = REPO_DIR / "public" / "data" / "processed"
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "firewatch.sqlite"
DEFAULT_HERITAGE_PATH = PUBLIC_PROCESSED_DIR / "heritage_all_layer.geojson"
DEFAULT_BURN_OPTIONS_PATH = PUBLIC_PROCESSED_DIR / "burn_options_layer.geojson"
DEFAULT_GRANITE_PATH = PUBLIC_PROCESSED_DIR / "granite_layer.geojson"
DEFAULT_METADATA_PATH = PUBLIC_PROCESSED_DIR / "metadata.json"


def calculate_site_score(
    fuel_risk: float | int | None,
    slope_risk: float | int | None,
    heritage_type_risk: float | int | None,
    burn_context_risk: float | int | None,
) -> int | None:
    if None in (fuel_risk, slope_risk, heritage_type_risk, burn_context_risk):
        return None

    return round(
        float(fuel_risk) * 0.45
        + float(slope_risk) * 0.25
        + float(heritage_type_risk) * 0.25
        + float(burn_context_risk) * 0.05
    )


def risk_level(score: int | float | None) -> str | None:
    if score is None:
        return None
    if score >= 64.2:
        return "High"
    if score >= 48.3:
        return "Medium"
    return "Low"


def heritage_data_source(source: str | None) -> str | None:
    if source is None:
        return None

    normalized = source.strip().lower().replace("_", " ")
    if normalized == "register":
        return "DPLH_099"
    if normalized == "lodged":
        return "DPLH_100"
    if normalized == "state register":
        return "DPLH_006"
    return None


def load_feature_collection(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("type") != "FeatureCollection":
        raise ValueError(f"{path} is not a GeoJSON FeatureCollection")
    return data.get("features", [])


def seed_geojson_features(
    connection: sqlite3.Connection,
    layer_name: str,
    source_path: Path,
) -> int:
    if not source_path.exists():
        return 0

    connection.execute(
        "DELETE FROM geojson_features WHERE layer_name = ?",
        (layer_name,),
    )

    count = 0
    for index, feature in enumerate(load_feature_collection(source_path)):
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        feature_id = props.get("identifier") or props.get("burnid") or props.get("id") or props.get("code")
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
                layer_name,
                index,
                str(feature_id) if feature_id is not None else None,
                json.dumps(geometry, separators=(",", ":")),
                json.dumps(props, separators=(",", ":")),
                str(source_path),
            ),
        )
        count += 1

    return count


def point_coordinates(geometry: dict[str, Any] | None) -> tuple[float | None, float | None]:
    if not geometry or geometry.get("type") != "Point":
        return None, None

    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        return None, None

    return float(coordinates[1]), float(coordinates[0])


def seed_demo_user(connection: sqlite3.Connection) -> int:
    connection.execute(
        """
        INSERT OR IGNORE INTO users (email, password_hash, role)
        VALUES (?, ?, ?)
        """,
        ("demo@firewatch.local", None, "admin"),
    )
    connection.execute(
        """
        INSERT OR IGNORE INTO users (email, password_hash, role)
        VALUES (?, ?, ?)
        """,
        (
            "frontendtest@example.com",
            generate_password_hash("123456"),
            "user",
        ),
    )
    row = connection.execute(
        "SELECT id FROM users WHERE email = ?",
        ("demo@firewatch.local",),
    ).fetchone()
    return int(row["id"])


def count_users(connection: sqlite3.Connection) -> int:
    row = connection.execute("SELECT COUNT(*) FROM users").fetchone()
    return int(row[0]) if row is not None else 0


def seed_heritage_sites(
    connection: sqlite3.Connection,
    heritage_path: Path,
    created_by: int,
) -> int:
    if not heritage_path.exists():
        return 0

    count = 0
    seen_site_ids: set[str] = set()
    for index, feature in enumerate(load_feature_collection(heritage_path)):
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        raw_site_id = props.get("identifier") or props.get("id")
        if not raw_site_id:
            continue
        base_site_id = str(raw_site_id)
        duplicate_site_id = base_site_id in seen_site_ids
        site_id = f"{base_site_id}#{index}" if duplicate_site_id else base_site_id
        seen_site_ids.add(base_site_id)
        identifier = None if duplicate_site_id else props.get("identifier") or base_site_id

        score = calculate_site_score(
            props.get("fuelRisk") or props.get("fuel_risk"),
            props.get("slope") or props.get("slope_risk"),
            props.get("heritageTypeRisk") or props.get("heritage_type_risk"),
            props.get("burnContext") or props.get("burn_management_risk"),
        )
        score = props.get("vulnerability_score", score)
        level = props.get("vulnerability_level") or risk_level(score)
        latitude, longitude = point_coordinates(geometry)
        latitude = props.get("latitude", latitude)
        longitude = props.get("longitude", longitude)

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
            ON CONFLICT(id) DO UPDATE SET
                identifier = excluded.identifier,
                name = excluded.name,
                source = excluded.source,
                data_source = excluded.data_source,
                geometry_json = excluded.geometry_json,
                properties_json = excluded.properties_json,
                latitude = excluded.latitude,
                longitude = excluded.longitude,
                heritage_type = excluded.heritage_type,
                fuel_class = excluded.fuel_class,
                slope_degrees = excluded.slope_degrees,
                vulnerability_score = excluded.vulnerability_score,
                vulnerability_level = excluded.vulnerability_level,
                assessed_date = excluded.assessed_date,
                created_by = excluded.created_by
            """,
            (
                site_id,
                identifier,
                props.get("name") or "Unnamed heritage site",
                props.get("source"),
                heritage_data_source(props.get("source")),
                json.dumps(geometry, separators=(",", ":")),
                json.dumps(props, separators=(",", ":")),
                latitude,
                longitude,
                props.get("heritageType") or props.get("place_type") or props.get("heritage_type_risk_label"),
                props.get("fuel_class"),
                props.get("slope") or props.get("slope_degrees"),
                score,
                level,
                props.get("assessedDate") or props.get("assessed_date"),
                created_by,
            ),
        )
        count += 1

    return count


def seed_burn_options(connection: sqlite3.Connection, burn_options_path: Path) -> int:
    if not burn_options_path.exists():
        return 0

    count = 0
    for feature in load_feature_collection(burn_options_path):
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        burn_id = props.get("burnid") or props.get("id")
        if not burn_id:
            continue
        burn_id = str(burn_id)

        connection.execute(
            """
            INSERT INTO burn_options (
                id,
                burnid,
                geometry_json,
                properties_json,
                location,
                fin_yr,
                status,
                priority,
                purpose
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                burnid = excluded.burnid,
                geometry_json = excluded.geometry_json,
                properties_json = excluded.properties_json,
                location = excluded.location,
                fin_yr = excluded.fin_yr,
                status = excluded.status,
                priority = excluded.priority,
                purpose = excluded.purpose
            """,
            (
                burn_id,
                burn_id,
                json.dumps(geometry, separators=(",", ":")),
                json.dumps(props, separators=(",", ":")),
                props.get("location") or props.get("name"),
                props.get("fin_yr"),
                props.get("status"),
                str(props.get("priority")) if props.get("priority") is not None else None,
                props.get("purpose") or props.get("burnContext"),
            ),
        )
        count += 1

    return count


def seed_granite_polygons(connection: sqlite3.Connection, granite_path: Path) -> int:
    if not granite_path.exists():
        return 0

    connection.execute("DELETE FROM granite_polygons")
    count = 0
    for feature in load_feature_collection(granite_path):
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        if not geometry:
            continue

        connection.execute(
            """
            INSERT INTO granite_polygons (
                geometry_json,
                properties_json,
                unit_name,
                code,
                rock_type,
                lithology
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                json.dumps(geometry, separators=(",", ":")),
                json.dumps(props, separators=(",", ":")),
                props.get("unit_name") or props.get("unitName") or props.get("name"),
                props.get("code"),
                props.get("rock_type") or props.get("rockType"),
                props.get("lithology"),
            ),
        )
        count += 1

    return count


def seed_metadata(connection: sqlite3.Connection, metadata_path: Path) -> int:
    if not metadata_path.exists():
        return 0

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    connection.execute(
        """
        INSERT INTO app_metadata (key, value_json, source_path)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value_json = excluded.value_json,
            source_path = excluded.source_path
        """,
        (
            "processed_metadata",
            json.dumps(metadata, separators=(",", ":")),
            str(metadata_path),
        ),
    )
    return 1


def seed_database(
    db_path: Path,
    heritage_path: Path,
    burn_options_path: Path,
    granite_path: Path,
    metadata_path: Path,
) -> dict[str, int]:
    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")

        connection.execute("DELETE FROM heritage_sites")
        connection.execute("DELETE FROM burn_options")
        connection.execute("DELETE FROM granite_polygons")

        created_by = seed_demo_user(connection)
        counts = {
            "users": count_users(connection),
            "heritage_sites": seed_heritage_sites(connection, heritage_path, created_by),
            "burn_options": seed_burn_options(connection, burn_options_path),
            "granite_polygons": seed_granite_polygons(connection, granite_path),
            "app_metadata": seed_metadata(connection, metadata_path),
            "geojson_features.heritage_all": seed_geojson_features(
                connection,
                "heritage_all",
                heritage_path,
            ),
            "geojson_features.burn_options": seed_geojson_features(
                connection,
                "burn_options",
                burn_options_path,
            ),
            "geojson_features.granite": seed_geojson_features(
                connection,
                "granite",
                granite_path,
            ),
        }
        connection.commit()
        return counts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed the FireWatch SQLite database from processed GeoJSON files."
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--heritage", type=Path, default=DEFAULT_HERITAGE_PATH)
    parser.add_argument("--burn-options", type=Path, default=DEFAULT_BURN_OPTIONS_PATH)
    parser.add_argument("--granite", type=Path, default=DEFAULT_GRANITE_PATH)
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA_PATH)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    counts = seed_database(
        args.db,
        args.heritage,
        args.burn_options,
        args.granite,
        args.metadata,
    )

    print(f"Seeded SQLite database at {args.db}")
    for table_name, count in counts.items():
        print(f"{table_name}: {count}")


if __name__ == "__main__":
    main()
