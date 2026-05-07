import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_DB_PATH = DATA_DIR / "firewatch.sqlite"


def load_json_data(filename):
    file_path = DATA_DIR / filename

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def find_record_by_id(records, record_id):
    for record in records:
        if record.get("id") == record_id:
            return record
    return None


def get_db_connection(db_path=DEFAULT_DB_PATH):
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def row_to_heritage_site(row):
    return {
        "id": row["id"],
        "identifier": row["identifier"],
        "name": row["name"],
        "source": row["source"],
        "dataSource": row["data_source"],
        "geometry": json.loads(row["geometry_json"]) if row["geometry_json"] else None,
        "properties": json.loads(row["properties_json"]) if row["properties_json"] else {},
        "coordinates": {
            "latitude": row["latitude"],
            "longitude": row["longitude"],
        },
        "heritageType": row["heritage_type"],
        "fuelClass": row["fuel_class"],
        "slopeDegrees": row["slope_degrees"],
        "vulnerabilityScore": row["vulnerability_score"],
        "vulnerabilityLevel": row["vulnerability_level"],
        "assessedDate": row["assessed_date"],
        "createdBy": row["created_by"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def row_to_heritage_feature(row):
    properties = json.loads(row["properties_json"]) if row["properties_json"] else {}
    properties.update({
        "id": row["identifier"] or row["id"],
        "identifier": row["identifier"] or row["id"],
        "name": row["name"],
        "source": row["source"],
        "data_source": row["data_source"],
        "longitude": row["longitude"],
        "latitude": row["latitude"],
        "place_type": row["heritage_type"],
        "fuel_class": row["fuel_class"],
        "slope_degrees": row["slope_degrees"],
        "vulnerability_score": row["vulnerability_score"],
        "vulnerability_level": row["vulnerability_level"],
    })

    return {
        "type": "Feature",
        "id": row["identifier"] or row["id"],
        "geometry": json.loads(row["geometry_json"]),
        "properties": properties,
    }


def get_heritage_registry_layer():
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM heritage_sites
            ORDER BY name COLLATE NOCASE
            """
        ).fetchall()

    return {
        "type": "FeatureCollection",
        "name": "heritage_registry",
        "features": [row_to_heritage_feature(row) for row in rows],
    }


def get_heritage_sites():
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM heritage_sites
            ORDER BY name COLLATE NOCASE
            """
        ).fetchall()

    return [row_to_heritage_site(row) for row in rows]


def get_heritage_site_by_id(site_id):
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM heritage_sites
            WHERE id = ? OR identifier = ?
            LIMIT 1
            """,
            (site_id, site_id),
        ).fetchone()

    return row_to_heritage_site(row) if row else None


def normalize_heritage_kind(value):
    normalized = str(value or "").strip().lower()
    if normalized == "aboriginal":
        return "Aboriginal"
    if normalized == "non-aboriginal":
        return "Non-Aboriginal"
    return None


def normalize_risk_level(value):
    normalized = str(value or "").strip().lower()
    if normalized == "high":
        return "High"
    if normalized == "medium":
        return "Medium"
    if normalized == "low":
        return "Low"
    return None


def require_text(data, field_name):
    value = data.get(field_name)
    if not isinstance(value, str) or value.strip() == "":
        raise ValueError(f"{field_name} is required")
    return value.strip()


def require_number(data, field_name, low=None, high=None):
    value = data.get(field_name)
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be a number")
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number") from None

    if low is not None and number < low:
        raise ValueError(f"{field_name} must be at least {low}")
    if high is not None and number > high:
        raise ValueError(f"{field_name} must be at most {high}")
    return number


def create_heritage_site(data):
    name = require_text(data, "site_name")
    heritage_type = require_text(data, "heritage_type")
    fuel_type = require_text(data, "fuel_type")
    burn_context = require_text(data, "burn_context")
    submitted_by = require_text(data, "added_by_user_name")
    latitude = require_number(data, "latitude", -90, 90)
    longitude = require_number(data, "longitude", -180, 180)
    slope = require_number(data, "slope", 0, 90)
    vulnerability_score = require_number(data, "vulnerability_score", 0, 100)

    heritage_kind = normalize_heritage_kind(data.get("heritage_kind"))
    if heritage_kind is None:
        raise ValueError("heritage_kind must be Aboriginal or Non-Aboriginal")

    vulnerability_level = normalize_risk_level(data.get("vulnerability_level"))
    if vulnerability_level is None:
        raise ValueError("vulnerability_level must be Low, Medium, or High")

    identifier = f"USER-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    geometry = {
        "type": "Point",
        "coordinates": [longitude, latitude],
    }
    properties = {
        "layer": "Heritage",
        "id": identifier,
        "identifier": identifier,
        "name": name,
        "heritage_kind": heritage_kind,
        "place_type": heritage_type,
        "source": "user",
        "longitude": longitude,
        "latitude": latitude,
        "fuel_class": fuel_type,
        "slope_degrees": slope,
        "burn_management_context": burn_context,
        "vulnerability_score": vulnerability_score,
        "vulnerability_level": vulnerability_level,
        "added_by_user_name": submitted_by,
        "enrichment_status": "User submitted site; environmental enrichment not run.",
    }

    with get_db_connection() as connection:
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
                vulnerability_level
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                identifier,
                identifier,
                name,
                "user",
                None,
                json.dumps(geometry, separators=(",", ":")),
                json.dumps(properties, separators=(",", ":")),
                latitude,
                longitude,
                heritage_type,
                fuel_type,
                slope,
                vulnerability_score,
                vulnerability_level,
            ),
        )
        row = connection.execute(
            "SELECT * FROM heritage_sites WHERE id = ?",
            (identifier,),
        ).fetchone()
        connection.commit()

    return row_to_heritage_site(row), row_to_heritage_feature(row)


def delete_user_heritage_site(site_id):
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT id, source
            FROM heritage_sites
            WHERE id = ? OR identifier = ?
            LIMIT 1
            """,
            (site_id, site_id),
        ).fetchone()

        if row is None:
            return "not_found"

        if str(row["source"] or "").strip().lower() != "user":
            return "not_user_site"

        connection.execute(
            "DELETE FROM heritage_sites WHERE id = ?",
            (row["id"],),
        )
        connection.commit()

    return "deleted"


def get_geojson_layer(layer_name):
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT feature_id, geometry_json, properties_json
            FROM geojson_features
            WHERE layer_name = ?
            ORDER BY feature_index
            """,
            (layer_name,),
        ).fetchall()

    features = []
    for row in rows:
        properties = json.loads(row["properties_json"])
        features.append({
            "type": "Feature",
            "id": row["feature_id"],
            "geometry": json.loads(row["geometry_json"]),
            "properties": properties,
        })

    return {
        "type": "FeatureCollection",
        "name": layer_name,
        "features": features,
    }


def get_processed_metadata():
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT value_json
            FROM app_metadata
            WHERE key = ?
            LIMIT 1
            """,
            ("processed_metadata",),
        ).fetchone()

    if row is None:
        return None
    return json.loads(row["value_json"])
