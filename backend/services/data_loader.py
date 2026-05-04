import json
import sqlite3
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
