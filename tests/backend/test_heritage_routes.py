from __future__ import annotations


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
