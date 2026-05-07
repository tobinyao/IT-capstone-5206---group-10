def test_home_returns_running_message(client):
    response = client.get("/")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload == {"message": "Backend is running"}


def test_metadata_endpoint_returns_json(client):
    response = client.get("/api/metadata")

    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload, dict)
    assert len(payload) > 0
