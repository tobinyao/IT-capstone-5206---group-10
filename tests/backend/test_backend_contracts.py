from __future__ import annotations

import json
from pathlib import Path


def _load_backend_json(relative_path: str):
    root_dir = Path(__file__).resolve().parents[2]
    file_path = root_dir / "backend" / relative_path
    assert file_path.exists(), f"Missing required data file: {file_path}"
    return json.loads(file_path.read_text(encoding="utf-8"))


def test_required_metadata_json_exists_and_is_valid():
    payload = _load_backend_json("data/metadata.json")
    assert isinstance(payload, dict)
    assert "score_formula" in payload


def test_required_heritage_sites_json_exists_and_is_valid():
    payload = _load_backend_json("data/heritage_sites.json")
    assert isinstance(payload, list)
    assert len(payload) > 0
    first = payload[0]
    assert "id" in first
    assert "name" in first
    assert "coordinates" in first


def test_score_formula_weights_sum_to_one():
    metadata = _load_backend_json("data/metadata.json")
    formula = metadata["score_formula"]

    heritage_weights = formula["heritage_vulnerability"]
    area_weights = formula["area_vulnerability"]

    assert abs(sum(heritage_weights.values()) - 1.0) < 1e-9
    assert abs(sum(area_weights.values()) - 1.0) < 1e-9


def test_site_assessment_scoring_matches_metadata_weights():
    from services.site_assessment import calculate_site_score

    metadata = _load_backend_json("data/metadata.json")
    weights = metadata["score_formula"]["heritage_vulnerability"]

    fuel = 10
    slope = 20
    heritage = 30
    burn = 40

    expected = round(
        fuel * weights["fuel_risk"]
        + slope * weights["slope_risk"]
        + heritage * weights["heritage_type_material_risk"]
        + burn * weights["burn_management_context"]
    )

    assert calculate_site_score(fuel, slope, heritage, burn) == expected


def test_fire_classification_mappings_exist():
    from services import risk_normalization

    assert isinstance(risk_normalization.FUEL_TYPE_RISK, dict)
    assert len(risk_normalization.FUEL_TYPE_RISK) > 0
    assert "Tall closed forest" in risk_normalization.FUEL_TYPE_RISK

    assert isinstance(risk_normalization.HERITAGE_TYPE_MATERIAL_RISK, dict)
    assert len(risk_normalization.HERITAGE_TYPE_MATERIAL_RISK) > 0

    assert isinstance(risk_normalization.BURN_CONTEXT_RISK, dict)
    assert "inside_burn_option" in risk_normalization.BURN_CONTEXT_RISK
