def test_register_rejects_invalid_email(client):
    response = client.post(
        "/api/register",
        json={"username": "test", "email": "not-an-email", "password": "secret12"},
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Invalid email format"


def test_register_accepts_valid_input(client):
    response = client.post(
        "/api/register",
        json={"username": "test", "email": "test@example.com", "password": "secret12"},
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["user"]["email"] == "test@example.com"


def test_login_rejects_missing_email(client):
    response = client.post(
        "/api/login",
        json={"password": "secret12"},
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Email is required"


def test_login_rejects_missing_password(client):
    response = client.post(
        "/api/login",
        json={"email": "test@example.com"},
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Password is required"


def test_login_rejects_invalid_email_format(client):
    response = client.post(
        "/api/login",
        json={"email": "not-an-email", "password": "secret12"},
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Invalid email format"


def test_login_accepts_valid_input(client):
    response = client.post(
        "/api/login",
        json={"email": "test@example.com", "password": "secret12"},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert "message" in payload


def test_register_trims_username_and_email(client):
    response = client.post(
        "/api/register",
        json={
            "username": "  test-user  ",
            "email": "  test@example.com  ",
            "password": "secret12",
        },
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["user"]["username"] == "test-user"
    assert payload["user"]["email"] == "test@example.com"


def test_site_assessment_validates_required_fields(client):
    response = client.post("/api/site-assessment", json={"fuelRisk": 50})

    assert response.status_code == 400
    payload = response.get_json()
    assert "is required" in payload["error"]


def test_site_assessment_returns_score_and_level(client):
    response = client.post(
        "/api/site-assessment",
        json={
            "fuelRisk": 100,
            "slopeRisk": 0,
            "heritageTypeRisk": 0,
            "burnContext": 0,
        },
    )

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["score"] == 45
    assert payload["riskLevel"] == "Low"
    assert payload["breakdown"]["fuelRisk"] == 100
