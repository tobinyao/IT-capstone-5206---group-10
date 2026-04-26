"""
Test 1: Import & Existence Tests

Verify that all required functions exist and are importable.
These tests can run even before functions are fully implemented.
"""
import pytest
import sys
from pathlib import Path

# Add current directory to path for imports
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))


class TestSiteAssessmentImports:
    """Test that site_assessment module exports required functions"""

    def test_site_assessment_module_importable(self):
        """Test that site_assessment module can be imported"""
        try:
            from services import site_assessment
            assert site_assessment is not None
        except ImportError:
            pytest.fail("Cannot import services.site_assessment module")

    def test_calculate_site_score_exists(self):
        """Test that calculate_site_score function exists"""
        from services.site_assessment import calculate_site_score
        assert callable(calculate_site_score)
        assert hasattr(calculate_site_score, '__call__')

    def test_get_risk_level_exists(self):
        """Test that get_risk_level function exists"""
        from services.site_assessment import get_risk_level
        assert callable(get_risk_level)
        assert hasattr(get_risk_level, '__call__')


class TestRiskModelImports:
    """Test that risk_model module exports required functions"""

    def test_risk_model_module_importable(self):
        """Test that risk_model module can be imported"""
        try:
            from services import risk_model
            assert risk_model is not None
        except ImportError:
            pytest.fail("Cannot import services.risk_model module")

    def test_score_slope_exists(self):
        """Test that score_slope function exists"""
        from services.risk_model import score_slope
        assert callable(score_slope)

    def test_score_fuel_age_exists(self):
        """Test that score_fuel_age function exists"""
        from services.risk_model import score_fuel_age
        assert callable(score_fuel_age)

    def test_score_granite_exists(self):
        """Test that score_granite function exists"""
        from services.risk_model import score_granite
        assert callable(score_granite)

    def test_calculate_risk_exists(self):
        """Test that calculate_risk function exists"""
        from services.risk_model import calculate_risk
        assert callable(calculate_risk)


class TestAppImports:
    """Test that Flask app can be imported"""

    def test_app_module_importable(self):
        """Test that app module can be imported"""
        try:
            from app import app
            assert app is not None
        except ImportError:
            pytest.fail("Cannot import app module")

    def test_app_is_flask_instance(self):
        """Test that app is a Flask instance"""
        from app import app
        from flask import Flask
        assert isinstance(app, Flask)
