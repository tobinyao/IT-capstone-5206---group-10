from __future__ import annotations

import pytest


@pytest.mark.parametrize(
    ("body", "content_type"),
    [
        ("not-json", "text/plain"),
        ("", "text/plain"),
    ],
)
def test_site_assessment_rejects_non_json_body(client, body, content_type):
    response = client.post(
        "/api/site-assessment",
        data=body,
        content_type=content_type,
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "Request body must be valid JSON"


def test_site_assessment_rejects_non_numeric_field(client):
    response = client.post(
        "/api/site-assessment",
        json={
            "fuelRisk": "high",
            "slopeRisk": 0,
            "heritageTypeRisk": 0,
            "burnContext": 0,
        },
    )

    assert response.status_code == 400
    payload = response.get_json()
    assert payload["error"] == "fuelRisk must be a number"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("fuelRisk", -1),
        ("fuelRisk", 101),
        ("slopeRisk", -0.1),
        ("burnContext", 100.0001),
    ],
)
def test_site_assessment_rejects_out_of_range_values(client, field, value):
    payload = {
        "fuelRisk": 0,
        "slopeRisk": 0,
        "heritageTypeRisk": 0,
        "burnContext": 0,
    }
    payload[field] = value

    response = client.post("/api/site-assessment", json=payload)

    assert response.status_code == 400
    error_payload = response.get_json()
    assert error_payload["error"] == f"{field} must be between 0 and 100"


def test_site_assessment_accepts_floats(client):
    response = client.post(
        "/api/site-assessment",
        json={
            "fuelRisk": 12.5,
            "slopeRisk": 0.0,
            "heritageTypeRisk": 0.0,
            "burnContext": 0.0,
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert "score" in payload
    assert "riskLevel" in payload


def test_site_assessment_accepts_boundary_values(client):
    response = client.post(
        "/api/site-assessment",
        json={
            "fuelRisk": 0,
            "slopeRisk": 100,
            "heritageTypeRisk": 0,
            "burnContext": 100,
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["breakdown"]["fuelRisk"] == 0
    assert payload["breakdown"]["slopeRisk"] == 100
