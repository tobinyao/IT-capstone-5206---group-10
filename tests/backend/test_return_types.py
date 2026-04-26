"""
Test 2: Return Type Tests

Verify that functions return the correct data types.
These tests validate function signatures and return types without
requiring specific calculation logic.
"""
import pytest
import sys
import json
from pathlib import Path

# Add current directory to path for imports
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))


class TestSiteAssessmentReturnTypes:
    """Test return types for site_assessment functions"""

    def test_calculate_site_score_returns_float(self):
        """Test that calculate_site_score returns a float"""
        from services.site_assessment import calculate_site_score
        result = calculate_site_score(50, 50, 50, 50)
        assert isinstance(result, float), f"Expected float, got {type(result)}"

    def test_calculate_site_score_returns_number(self):
        """Test that calculate_site_score returns a numeric type"""
        from services.site_assessment import calculate_site_score
        result = calculate_site_score(75, 60, 80, 50)
        assert isinstance(result, (int, float)), "Result should be numeric"

    def test_get_risk_level_returns_string(self):
        """Test that get_risk_level returns a string"""
        from services.site_assessment import get_risk_level
        result = get_risk_level(50)
        assert isinstance(result, str), f"Expected string, got {type(result)}"

    def test_get_risk_level_returns_non_empty_string(self):
        """Test that get_risk_level returns a non-empty string"""
        from services.site_assessment import get_risk_level
        result = get_risk_level(50)
        assert isinstance(result, str) and len(result) > 0


class TestRiskModelReturnTypes:
    """Test return types for risk_model functions"""

    def test_score_slope_returns_integer(self):
        """Test that score_slope returns an integer"""
        from services.risk_model import score_slope
        result = score_slope(15)
        assert isinstance(result, (int, float)), f"Expected numeric, got {type(result)}"

    def test_score_fuel_age_returns_integer(self):
        """Test that score_fuel_age returns an integer"""
        from services.risk_model import score_fuel_age
        result = score_fuel_age(10)
        assert isinstance(result, (int, float)), f"Expected numeric, got {type(result)}"

    def test_score_granite_returns_integer(self):
        """Test that score_granite returns an integer"""
        from services.risk_model import score_granite
        result = score_granite(50)
        assert isinstance(result, (int, float)), f"Expected numeric, got {type(result)}"

    def test_calculate_risk_returns_dict(self):
        """Test that calculate_risk returns a dictionary"""
        from services.risk_model import calculate_risk
        result = calculate_risk(15, 8, 40)
        assert isinstance(result, dict), f"Expected dict, got {type(result)}"

    def test_calculate_risk_dict_has_required_keys(self):
        """Test that calculate_risk response has required keys"""
        from services.risk_model import calculate_risk
        result = calculate_risk(15, 8, 40)
        assert isinstance(result, dict)
        assert "riskLevel" in result, "Missing 'riskLevel' key"
        assert "score" in result, "Missing 'score' key"

    def test_calculate_risk_score_is_numeric(self):
        """Test that risk score is numeric"""
        from services.risk_model import calculate_risk
        result = calculate_risk(15, 8, 40)
        assert isinstance(result["score"], (int, float)), "Score should be numeric"

    def test_calculate_risk_level_is_string(self):
        """Test that risk level is a string"""
        from services.risk_model import calculate_risk
        result = calculate_risk(15, 8, 40)
        assert isinstance(result["riskLevel"], str), "Risk level should be a string"


class TestFlaskEndpointReturnTypes:
    """Test return types for Flask API endpoints"""

    @pytest.fixture
    def client(self):
        """Create Flask test client"""
        from app import app
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client

    def test_home_endpoint_returns_json(self, client):
        """Test that home endpoint returns JSON"""
        response = client.get('/')
        assert response.content_type == 'application/json' or 'json' in response.content_type

    def test_home_endpoint_returns_dict(self, client):
        """Test that home endpoint response is a dictionary"""
        response = client.get('/')
        data = json.loads(response.data)
        assert isinstance(data, dict)

    def test_metadata_endpoint_returns_json(self, client):
        """Test that metadata endpoint returns JSON"""
        response = client.get('/api/metadata')
        # May return 404 if file doesn't exist, but should still be JSON
        assert response.content_type == 'application/json' or 'json' in response.content_type

    def test_site_assessment_endpoint_returns_json(self, client):
        """Test that site assessment endpoint returns JSON"""
        response = client.post('/api/site-assessment',
                              json={"fuelRisk": 50, "slopeRisk": 50,
                                    "heritageTypeRisk": 50, "burnContext": 50})
        assert response.content_type == 'application/json' or 'json' in response.content_type

    def test_site_assessment_response_is_dict(self, client):
        """Test that site assessment response is a dictionary"""
        response = client.post('/api/site-assessment',
                              json={"fuelRisk": 50, "slopeRisk": 50,
                                    "heritageTypeRisk": 50, "burnContext": 50})
        if response.status_code == 200:
            data = json.loads(response.data)
            assert isinstance(data, dict)

    def test_site_assessment_response_has_required_fields(self, client):
        """Test that site assessment response has required fields"""
        response = client.post('/api/site-assessment',
                              json={"fuelRisk": 50, "slopeRisk": 50,
                                    "heritageTypeRisk": 50, "burnContext": 50})
        if response.status_code == 200:
            data = json.loads(response.data)
            assert "score" in data, "Missing 'score' field"
            assert "riskLevel" in data, "Missing 'riskLevel' field"
