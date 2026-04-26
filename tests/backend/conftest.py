"""
Pytest configuration and shared fixtures for backend tests
"""
import pytest


@pytest.fixture
def mock_site_data():
    """Fixture for mock heritage site assessment data"""
    return {
        "fuel_risk": 75,
        "slope_risk": 60,
        "heritage_risk": 80,
        "burn_context": 50
    }


@pytest.fixture
def mock_risk_model_input():
    """Fixture for mock risk model input data"""
    return {
        "slope": 25,
        "fuel_age": 15,
        "granite_index": 60
    }


@pytest.fixture
def expected_score_ranges():
    """Fixture for expected score ranges for boundary testing"""
    return {
        "low": (0, 39),
        "medium": (40, 69),
        "high": (70, 100)
    }
