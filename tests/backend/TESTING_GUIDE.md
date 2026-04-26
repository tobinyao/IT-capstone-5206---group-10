# Backend Testing Guide

## Quick Start

### Install Dependencies
```bash
pip install -r tests/backend/requirements.txt
```

### Run All Backend Tests
```bash
# From project root
pytest tests/backend/

# With coverage
pytest tests/backend/ --cov-report=html
```

---

## Testing Organization

### Project Structure
```
tests/backend/
├── app.py                       # Flask application
├── services/                    # Backend services
│   ├── site_assessment.py      # Service implementation
│   └── risk_model.py           # Service implementation
├── conftest.py                 # Shared fixtures
├── test_*.py                   # Test files (add here)
├── requirements.txt            # Dependencies
└── TESTING_GUIDE.md           # This file
```

---

## Test Categories

### 1. **Unit Tests** (Services)
Test individual functions in `services/` directory
- `test_site_assessment.py` - Site assessment calculations
- `test_risk_model.py` - Risk scoring functions

**Run unit tests:**
```bash
pytest tests/backend/test_site_assessment.py tests/backend/test_risk_model.py -v
```

### 2. **Integration Tests** (API)
Test Flask endpoints in `app.py`
- `test_app.py` - API endpoints and CORS

**Run API tests:**
```bash
pytest tests/backend/test_app.py -v
```

---

## Common pytest Commands

```bash
# Run all backend tests
pytest tests/backend/

# Run with verbose output
pytest tests/backend/ -v

# Run specific test file
pytest tests/backend/test_site_assessment.py

# Run specific test class
pytest tests/backend/test_site_assessment.py::TestCalculateSiteScore

# Run specific test
pytest tests/backend/test_site_assessment.py::TestCalculateSiteScore::test_calculate_score

# Run tests matching a pattern
pytest tests/backend/ -k "boundary"

# Run with detailed output on failures
pytest tests/backend/ -vv --tb=long

# Run with coverage report
pytest tests/backend/ --cov-report=html

# Run with coverage report in terminal
pytest tests/backend/ --cov-report=term-missing
```

---

## Available Fixtures

Use these fixtures in your tests (defined in `conftest.py`):

```python
def test_something(mock_site_data):
    """Access mock site assessment data"""
    fuel = mock_site_data["fuel_risk"]  # 75
    slope = mock_site_data["slope_risk"]  # 60
    # ...

def test_something(expected_score_ranges):
    """Access expected score boundaries"""
    low_min, low_max = expected_score_ranges["low"]  # (0, 39)
    # ...
```

---

## Adding New Tests

### Template for Unit Tests

```python
"""
Tests for new_service.py
"""
import pytest
from services.new_service import some_function


class TestSomeFunction:
    """Test suite for some_function"""

    def test_happy_path(self):
        """Test normal operation"""
        result = some_function(valid_input)
        assert result == expected_output

    def test_edge_case_zero(self):
        """Test with zero/empty input"""
        result = some_function(0)
        assert result == expected_output

    def test_edge_case_max(self):
        """Test with maximum input"""
        result = some_function(100)
        assert result == expected_output

    @pytest.mark.parametrize("input_val,expected", [
        (val1, expected1),
        (val2, expected2),
    ])
    def test_multiple_scenarios(self, input_val, expected):
        """Parametrized test for multiple inputs"""
        assert some_function(input_val) == expected
```

### Template for API Tests

```python
"""
Tests for Flask endpoints
"""
import pytest
import json
from app import app


@pytest.fixture
def client():
    """Create test client for Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestEndpoint:
    """Test suite for an endpoint"""

    def test_endpoint_returns_200(self, client):
        """Test successful request"""
        response = client.get('/api/endpoint')
        assert response.status_code == 200

    def test_endpoint_response_format(self, client):
        """Test response structure"""
        response = client.get('/api/endpoint')
        data = json.loads(response.data)
        assert 'required_field' in data
```

---

## Coverage Goals

When adding tests, aim to cover:
- ✅ Happy path (typical usage)
- ✅ Edge cases (zero, min, max values)
- ✅ Boundaries (classification thresholds)
- ✅ Error scenarios (invalid input, missing data)
- ✅ Integration (components working together)

---

## Running Tests in CI/CD

Use in your CI pipeline:
```bash
pytest tests/backend/ --cov-report=xml --cov-report=html --junitxml=report.xml
```

This generates:
- `report.xml` - JUnit format for CI systems
- `htmlcov/index.html` - HTML coverage report
