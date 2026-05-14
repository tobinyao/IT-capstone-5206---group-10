from __future__ import annotations


def test_get_sites_returns_count_and_sites(client, seeded_backend_db):
    response = client.get("/api/sites")

    assert response.status_code == 200
    payload = response.get_json()

    assert isinstance(payload, dict)
    assert payload["count"] == 1
    assert isinstance(payload["sites"], list)
    assert payload["sites"][0]["id"] == seeded_backend_db["site_id"]


def test_get_site_by_id_returns_site(client, seeded_backend_db):
    response = client.get(f"/api/sites/{seeded_backend_db['site_id']}")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["id"] == seeded_backend_db["site_id"]
    assert payload["name"] == "Test Heritage Site"
    assert "coordinates" in payload
    assert payload["coordinates"]["latitude"] == -33.0


def test_get_site_by_identifier_returns_site(client, seeded_backend_db):
    response = client.get(f"/api/sites/{seeded_backend_db['identifier_id']}")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["id"] == "site-2"
    assert payload["name"] == "Identifier Heritage Site"


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


def test_layers_burn_options_returns_feature_collection(client, seeded_backend_db):
    response = client.get("/api/layers/burn-options")

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["type"] == "FeatureCollection"
    assert payload["name"] == "burn_options"
    assert isinstance(payload["features"], list)
    assert len(payload["features"]) == 1


def test_get_sites_returns_500_on_loader_error(client, monkeypatch):
    import services.data_loader as data_loader

    def _raise_error():
        raise RuntimeError("db down")

    monkeypatch.setattr(data_loader, "get_heritage_sites", _raise_error)

    response = client.get("/api/sites")

    assert response.status_code == 500
    payload = response.get_json()
    assert "could not load heritage sites" in payload["error"]


def test_get_site_by_id_returns_500_on_loader_error(client, monkeypatch, seeded_backend_db):
    import services.data_loader as data_loader

    def _raise_error(site_id):
        raise RuntimeError("db down")

    monkeypatch.setattr(data_loader, "get_heritage_site_by_id", _raise_error)

    response = client.get(f"/api/sites/{seeded_backend_db['site_id']}")

    assert response.status_code == 500
    payload = response.get_json()
    assert "could not load heritage site" in payload["error"]


def _valid_heritage_payload():
    return {
        "site_name": "User Site",
        "heritage_type": "Historic",
        "fuel_type": "Forest",
        "burn_context": "Low",
        "added_by_user_name": "Tester",
        "latitude": -33.2,
        "longitude": 151.2,
        "slope": 12,
        "vulnerability_score": 50,
        "heritage_kind": "Aboriginal",
        "vulnerability_level": "Medium",
    }


def test_add_heritage_site_creates_user_site(client, seeded_backend_db):
    response = client.post("/api/sites", json=_valid_heritage_payload())

    assert response.status_code == 201
    payload = response.get_json()

    assert payload["site"]["source"] == "user"
    assert payload["site"]["name"] == "User Site"
    assert payload["feature"]["properties"]["identifier"].startswith("USER-")


def test_add_heritage_site_rejects_missing_json(client):
    response = client.post("/api/sites", data="not-json", content_type="text/plain")

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Request body must be valid JSON"


def test_add_heritage_site_rejects_invalid_payload(client, seeded_backend_db):
    payload = _valid_heritage_payload()
    payload.pop("site_name")

    response = client.post("/api/sites", json=payload)

    assert response.status_code == 400
    error_payload = response.get_json()
    assert error_payload["error"] == "site_name is required"


def test_add_heritage_site_rejects_invalid_heritage_kind(client, seeded_backend_db):
    payload = _valid_heritage_payload()
    payload["heritage_kind"] = "Unknown"

    response = client.post("/api/sites", json=payload)

    assert response.status_code == 400
    error_payload = response.get_json()
    assert error_payload["error"] == "heritage_kind must be Aboriginal or Non-Aboriginal"


def test_add_heritage_site_rejects_invalid_vulnerability_level(client, seeded_backend_db):
    payload = _valid_heritage_payload()
    payload["vulnerability_level"] = "Extreme"

    response = client.post("/api/sites", json=payload)

    assert response.status_code == 400
    error_payload = response.get_json()
    assert error_payload["error"] == "vulnerability_level must be Low, Medium, or High"


def test_add_heritage_site_rejects_out_of_range_latitude(client, seeded_backend_db):
    payload = _valid_heritage_payload()
    payload["latitude"] = -91

    response = client.post("/api/sites", json=payload)

    assert response.status_code == 400
    error_payload = response.get_json()
    assert error_payload["error"] == "latitude must be at least -90"


def test_delete_heritage_site_rejects_non_user_site(client, seeded_backend_db):
    response = client.delete(f"/api/sites/{seeded_backend_db['site_id']}")

    assert response.status_code == 403
    payload = response.get_json()
    assert payload["error"] == "only user-submitted heritage sites can be deleted"


def test_delete_heritage_site_returns_404_for_missing_site(client):
    response = client.delete("/api/sites/does-not-exist")

    assert response.status_code == 404
    payload = response.get_json()
    assert payload["error"] == "heritage site not found"


def test_delete_heritage_site_deletes_user_site(client, seeded_backend_db):
    create_response = client.post("/api/sites", json=_valid_heritage_payload())
    created_payload = create_response.get_json()
    site_id = created_payload["site"]["id"]

    response = client.delete(f"/api/sites/{site_id}")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["deleted"] is True
    assert payload["id"] == site_id
