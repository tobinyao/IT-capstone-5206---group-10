# Backend API Documentation

This document describes the backend API endpoints for the Fire Vulnerability App.

## Base URL

```text
http://127.0.0.1:5000
```

1. Health Check
Endpoint
```
GET /
```
Purpose

Checks whether the Flask backend is running.

Example Response
```JSON
{
  "message": "Backend is running"
}
```
2. Metadata
Endpoint
```
GET /api/metadata
```
Purpose

Returns model metadata, including scoring weights and model notes.
This supports the Model Insights page.

Example Request
```Bash
curl http://127.0.0.1:5000/api/metadata
```
Example Response
```JSON
{
  "score_formula": {
    "area_vulnerability": {
      "fuel_risk": 0.55,
      "slope_risk": 0.35,
      "granite_influence": 0.1
    },
    "heritage_vulnerability": {
      "fuel_risk": 0.45,
      "slope_risk": 0.25,
      "heritage_type_material_risk": 0.25,
      "burn_management_context": 0.05
    }
  }
}
```
3. Site Assessment
Endpoint
```
POST /api/site-assessment
```
Purpose

Calculates a heritage site vulnerability score based on model-ready risk inputs.
This supports the Site Assessment page.

Request Body
```JSON
{
  "fuelRisk": 80,
  "slopeRisk": 60,
  "heritageTypeRisk": 70,
  "burnContext": 40
}
```
Example Request
```Bash
curl -X POST http://127.0.0.1:5000/api/site-assessment \
-H "Content-Type: application/json" \
-d '{"fuelRisk":80,"slopeRisk":60,"heritageTypeRisk":70,"burnContext":40}'
```
Example Response
```JSON
{
  "breakdown": {
    "burnContext": 40,
    "fuelRisk": 80,
    "heritageTypeRisk": 70,
    "slopeRisk": 60
  },
  "riskLevel": "High",
  "score": 70.5
}
```
4. Validation

The site assessment endpoint validates input before calculation.

Rules
All required fields must be present.
All values must be numbers.
All values must be between 0 and 100.
Example Invalid Request
```Bash
curl -X POST http://127.0.0.1:5000/api/site-assessment \
-H "Content-Type: application/json" \
-d '{"fuelRisk":150,"slopeRisk":60,"heritageTypeRisk":70,"burnContext":40}'
```
Example Error Response
```JSON
{
  "error": "fuelRisk must be between 0 and 100"
}
```
Notes

The backend currently provides metadata and site assessment support.
Map visualisation and layer display are handled by the frontend, while the backend provides model data and assessment results.