from __future__ import annotations

import json
import sqlite3

from routes import heritage_routes


def test_get_sites_returns_count_and_sites(client, seeded_backend_db):
    response = client.get("/api/sites")

    assert response.status_code == 200
    payload = response.get_json()

    assert isinstance(payload, dict)
    assert payload["count"] == 1
    assert isinstance(payload["sites"], list)
    assert payload["sites"][0]["id"] == seeded_backend_db["site_id"]


def test_get_heritage_alias_returns_count_and_sites(client, seeded_backend_db):
    response = client.get("/api/heritage")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["count"] == 1
    assert payload["sites"][0]["id"] == seeded_backend_db["site_id"]


def test_get_site_by_id_returns_site(client, seeded_backend_db):
    response = client.get(f"/api/sites/{seeded_backend_db['site_id']}")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["id"] == seeded_backend_db["site_id"]
    assert payload["name"] == "Test Heritage Site"
    assert "coordinates" in payload
    assert payload["coordinates"]["latitude"] == -33.0


def test_get_heritage_alias_by_id_returns_site(client, seeded_backend_db):
    response = client.get(f"/api/heritage/{seeded_backend_db['site_id']}")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["id"] == seeded_backend_db["site_id"]


def test_get_site_by_id_returns_404_for_missing_site(client, seeded_backend_db):
    response = client.get("/api/sites/does-not-exist")

    assert response.status_code == 404
    payload = response.get_json()
    assert payload["error"] == "heritage site not found"


def test_get_site_by_identifier_returns_site(client, seeded_backend_db):
    db_path = seeded_backend_db["db_path"]
    identifier = "FRK-999"

    with sqlite3.connect(db_path) as connection:
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
                "site-2",
                identifier,
                "Identifier Site",
                "register",
                "DPLH_099",
                json.dumps({"type": "Point", "coordinates": [150.5, -33.5]}, separators=(",", ":")),
                json.dumps({"identifier": identifier, "name": "Identifier Site"}, separators=(",", ":")),
                -33.5,
                150.5,
                "Historic",
                "Forest",
                12.0,
                40.0,
                "Low",
            ),
        )
        connection.commit()

    response = client.get(f"/api/heritage/{identifier}")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["id"] == "site-2"
    assert payload["identifier"] == identifier


def test_get_sites_returns_500_when_loader_fails(client, monkeypatch):
    def raise_loader_error():
        raise RuntimeError("boom")

    monkeypatch.setattr(heritage_routes, "load_heritage_sites_from_db", raise_loader_error)

    response = client.get("/api/heritage")

    assert response.status_code == 500
    payload = response.get_json()
    assert payload["error"] == "could not load heritage sites: boom"


def test_processed_metadata_returns_seeded_payload(client, seeded_backend_db):
    response = client.get("/api/processed-metadata")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload == seeded_backend_db["processed_metadata"]


def test_processed_metadata_returns_404_when_missing(client, seeded_backend_db_no_metadata):
    response = client.get("/api/processed-metadata")

    assert response.status_code == 404
    payload = response.get_json()
    assert payload["error"] == "processed metadata not found"


def test_layers_burn_options_returns_feature_collection(client, seeded_backend_db):
    response = client.get("/api/layers/burn-options")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["type"] == "FeatureCollection"
    assert payload["name"] == "burn_options"
    assert isinstance(payload["features"], list)
    assert len(payload["features"]) == 1
