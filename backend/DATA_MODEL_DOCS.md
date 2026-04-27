# Data Model and Processing Documentation

This document covers the data processing layer, risk normalisation module, heritage data endpoints, and processed data output structure for the Fire Vulnerability Assessment Tool.

---

## Scope

This document describes data/model work completed across separate feature branches:

- PR 22: risk normalisation utilities
- PR 23: heritage data endpoint Blueprint and data loading helpers
- PR 35: processed data output structure

Some modules are implemented in separate feature branches and may need to be merged before all documented paths exist together in `main`.

---

## Table of Contents

1. [Risk Normalisation Module](#1-risk-normalisation-module)
2. [Heritage Data API Endpoints](#2-heritage-data-api-endpoints)
3. [Data Schemas](#3-data-schemas)
4. [Processed Data Output Structure](#4-processed-data-output-structure)

---

## 1. Risk Normalisation Module

**File:** `backend/services/risk_normalization.py`

This module converts raw environmental and heritage inputs into model-ready 0–100 risk scores. It is designed to be used by the site assessment and area vulnerability calculations before scores are passed to the weighting formulas defined in `metadata.json`.

### 1.1 Score Ranges and Conventions

All output scores use a consistent 0–100 scale:

| Score range | Meaning |
|---|---|
| 0–39 | Low risk contribution |
| 40–69 | Medium risk contribution |
| 70–100 | High risk contribution |

### 1.2 Lookup Tables

#### `FUEL_TYPE_RISK`

Maps vegetation/fuel type category to a risk score.

| Category | Score |
|---|---|
| `forest` | 90 |
| `woodland` | 75 |
| `shrubland` | 65 |
| `grassland` | 35 |
| `cleared` | 10 |
| `urban` | 5 |
| `water` | 0 |

#### `HERITAGE_TYPE_MATERIAL_RISK`

Maps Aboriginal heritage site type to material sensitivity risk score.

| Heritage Type | Score |
|---|---|
| Rock art / petroglyphs | 90 |
| Culturally modified trees | 85 |
| Timber structures | 80 |
| Ochre extraction site | 65 |
| Earthen mound / midden | 60 |
| Artefact scatter | 45 |
| Stone arrangement | 35 |

#### `BURN_CONTEXT_RISK`

Maps burn management context to risk score.

| Context | Score |
|---|---|
| `planned_burn_overlap` | 90 |
| `inside_burn_option` | 80 |
| `near_burn_option` | 45 |
| `outside_burn_option` | 10 |

#### `GRANITE_INFLUENCE`

Maps geology category to granite influence score.

| Category | Score |
|---|---|
| `very_high` | 100 |
| `high` | 75 |
| `medium` | 50 |
| `low` | 25 |
| `none` | 0 |

---

### 1.3 Conversion Functions

#### `slope_to_risk(slope_value, max_slope_degrees=45)`

Converts slope in degrees to a 0–100 Slope Risk score using linear scaling.

| Parameter | Type | Description |
|---|---|---|
| `slope_value` | `float` | Slope in degrees |
| `max_slope_degrees` | `float` | Upper bound for scaling (default: 45°) |

**Returns:** `float` — Slope Risk score, clamped to 0–100.

**Example:**
```python
slope_to_risk(22.5)   # → 50.0
slope_to_risk(45)     # → 100.0
slope_to_risk(0)      # → 0.0
```

---

#### `fuel_to_risk(fuel_value, max_fuel_age_years=30, fuel_type_mapping=None)`

Converts fuel age (years) or fuel type category to a 0–100 Fuel Risk score.

- If `fuel_value` is a **number**, it is treated as fuel age and scaled linearly against `max_fuel_age_years`.
- If `fuel_value` is a **string**, it is looked up in `FUEL_TYPE_RISK` (or a custom mapping).

| Parameter | Type | Description |
|---|---|---|
| `fuel_value` | `int / float / str` | Fuel age in years, or fuel type category |
| `max_fuel_age_years` | `float` | Upper bound for age scaling (default: 30) |
| `fuel_type_mapping` | `dict` | Optional override for the default lookup table |

**Returns:** `float` — Fuel Risk score, clamped to 0–100.

**Example:**
```python
fuel_to_risk(15)            # → 50.0  (15 / 30 * 100)
fuel_to_risk(30)            # → 100.0
fuel_to_risk("woodland")    # → 75.0
fuel_to_risk("grassland")   # → 35.0
```

---

#### `granite_to_influence(granite_value, granite_mapping=None)`

Converts a granite index (0–100 numeric) or geology category to a Granite Influence score.

- If `granite_value` is a **number**, it is passed through and clamped.
- If `granite_value` is a **string**, it is looked up in `GRANITE_INFLUENCE`.

**Example:**
```python
granite_to_influence(65)        # → 65.0
granite_to_influence("high")    # → 75.0
```

---

#### `heritage_type_to_material_risk(heritage_type, heritage_type_mapping=None)`

Converts a heritage site type string to a Heritage Type Material Risk score using `HERITAGE_TYPE_MATERIAL_RISK`.

**Example:**
```python
heritage_type_to_material_risk("Rock art / petroglyphs")   # → 90
heritage_type_to_material_risk("Stone arrangement")         # → 35
```

---

#### `burn_context_to_risk(burn_context, burn_context_mapping=None)`

Converts burn management context to a Burn Context risk score.

- `bool` input: `True` → 80, `False` → 10
- Numeric input: passed through and clamped
- String input: looked up in `BURN_CONTEXT_RISK`

**Example:**
```python
burn_context_to_risk("planned_burn_overlap")   # → 90
burn_context_to_risk(True)                     # → 80
burn_context_to_risk(60)                       # → 60.0
```

---

#### `standardize_risk_inputs(data, config=None)`

Main entry point. Accepts a raw input dict and returns all five model-ready risk scores.

**Accepted input keys:**

| Key | Type | Description |
|---|---|---|
| `slope` | `float` | Slope in degrees |
| `fuelAge` | `float` | Fuel age in years (takes priority over `fuelType`) |
| `fuelType` | `str` | Fuel type category (used if `fuelAge` absent) |
| `graniteIndex` | `float` | Granite index 0–100 (takes priority over `graniteInfo`) |
| `graniteInfo` | `str` | Geology category (used if `graniteIndex` absent) |
| `heritageType` | `str` | Heritage site type |
| `burnContext` | `str / float` | Burn context (takes priority over `burnOptionOverlap`) |
| `burnOptionOverlap` | `bool` | Burn overlap flag (used if `burnContext` absent) |

**Returns:** `dict` with keys `slopeRisk`, `fuelRisk`, `graniteInfluence`, `heritageTypeRisk`, `burnContext` — all floats in 0–100.

**Example:**
```python
from services.risk_normalization import standardize_risk_inputs

raw = {
    "slope": 28,
    "fuelAge": 14,
    "graniteIndex": 65,
    "heritageType": "Rock art / petroglyphs",
    "burnContext": "near_burn_option"
}

result = standardize_risk_inputs(raw)
# {
#   "slopeRisk": 62.22,
#   "fuelRisk": 46.67,
#   "graniteInfluence": 65.0,
#   "heritageTypeRisk": 90.0,
#   "burnContext": 45.0
# }
```

These scores are intended to be passed to `calculate_site_score()` in `site_assessment.py`.

---

## 2. Heritage Data API Endpoints

**Files:** `backend/routes/heritage_routes.py`, `backend/services/data_loader.py`

The heritage endpoints are implemented as a Flask Blueprint with the `/api` prefix. The Blueprint must be registered in the main Flask app before the endpoints become active. Once registered, they provide read access to the structured heritage site data.

### `GET /api/heritage`

Returns all heritage sites with a count.

**Example Request:**
```bash
curl http://127.0.0.1:5000/api/heritage
```

**Example Response:**
```json
{
  "count": 5,
  "sites": [
    {
      "id": "FRK-094",
      "name": "Bilya Mia Rock Shelter",
      "heritageType": "Rock art / petroglyphs",
      "source": "ACHIS",
      "coordinates": { "latitude": -34.95, "longitude": 117.35 },
      "slope": 28,
      "fuelAge": 14,
      "graniteIndex": 65,
      "burnContext": 60,
      "assessedDate": "2026-03-28"
    }
  ]
}
```

**Error Response (data file missing):**
```json
{ "error": "heritage_sites.json not found" }
```

---

### `GET /api/heritage/<site_id>`

Returns a single heritage site by its ID.

| Parameter | Type | Description |
|---|---|---|
| `site_id` | `string` | Site ID, e.g. `FRK-094` |

**Example Request:**
```bash
curl http://127.0.0.1:5000/api/heritage/FRK-094
```

**Example Response:**
```json
{
  "id": "FRK-094",
  "name": "Bilya Mia Rock Shelter",
  "heritageType": "Rock art / petroglyphs",
  "source": "ACHIS",
  "coordinates": { "latitude": -34.95, "longitude": 117.35 },
  "slope": 28,
  "fuelAge": 14,
  "graniteIndex": 65,
  "burnContext": 60,
  "assessedDate": "2026-03-28"
}
```

**Error Response (site not found):**
```json
{ "error": "heritage site not found" }
```
Status: `404`

---

### Data Loader Utility

`backend/services/data_loader.py` provides two reusable functions for other endpoints:

#### `load_json_data(filename)`

Loads a JSON file from `backend/data/` by filename.

```python
from services.data_loader import load_json_data

sites = load_json_data("heritage_sites.json")
```

#### `find_record_by_id(records, record_id)`

Returns the first record in a list where `record["id"] == record_id`, or `None` if not found.

```python
site = find_record_by_id(sites, "FRK-094")
```

---

## 3. Data Schemas

### Heritage Site Record (`heritage_sites.json`)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Site identifier, e.g. `FRK-094` |
| `name` | `string` | Site name |
| `heritageType` | `string` | Heritage type (matches `HERITAGE_TYPE_MATERIAL_RISK` keys) |
| `source` | `string` | Data source: `ACHIS`, `Inherit`, or `Field observation` |
| `coordinates.latitude` | `float` | Latitude (WGS84 / EPSG:4326) |
| `coordinates.longitude` | `float` | Longitude (WGS84 / EPSG:4326) |
| `slope` | `int` | Slope in degrees |
| `fuelAge` | `int` | Fuel age in years |
| `graniteIndex` | `int` | Granite index 0–100 |
| `burnContext` | `int` | Burn context score 0–100 |
| `assessedDate` | `string` | Assessment date, ISO format `YYYY-MM-DD` |

### Model-Ready Field Convention

When heritage site data is processed and output as GeoJSON, the following field names are used:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Site identifier |
| `name` | `string` | Site name |
| `heritageType` | `string` | Heritage type label |
| `source` | `string` | Data source |
| `slope` | `int` | Raw slope in degrees |
| `fuelRisk` | `float` | Computed Fuel Risk score (0–100) |
| `graniteInfluence` | `float` | Computed Granite Influence score (0–100) |
| `burnContext` | `float` | Computed Burn Context score (0–100) |
| `heritageTypeRisk` | `float` | Computed Heritage Type Material Risk (0–100) |

---

## 4. Processed Data Output Structure

**Directory:** `backend/data/processed/`

This directory holds model-ready processed outputs, separate from the raw source data in `backend/data/`.

```
backend/data/processed/
  README.md
  metadata.processed.sample.json
  geojson/
    heritage_sites.sample.geojson
    burn_options.sample.geojson
  overlays/
    README.md
```

### Layer Types

| Layer | Format | Description |
|---|---|---|
| `heritage_sites.sample.geojson` | GeoJSON Point | Anonymised heritage site points with model-ready attributes |
| `burn_options.sample.geojson` | GeoJSON Polygon | Sample burn option polygons with burn context risk |
| `slope_risk.tif` *(expected)* | Raster | Slope risk grid, score range 0–100 |
| `fuel_risk.tif` *(expected)* | Raster | Fuel risk grid, score range 0–100 |
| `granite_influence.tif` *(expected)* | Raster | Granite influence grid, score range 0–100 |
| `area_vulnerability.tif` *(expected)* | Raster | Composite area vulnerability grid |

### Data Sensitivity Rule

Real Aboriginal heritage location coordinates may be culturally sensitive. **Do not commit real protected coordinates** to this repository unless the project has explicit permission from the relevant heritage authority and Traditional Owners. Use sample, anonymised, or generalised coordinates for MVP demonstration.

### Coordinate Reference System

All spatial outputs use **WGS84 (EPSG:4326)**.

---

## How the Modules Connect

```
Raw frontend input (slope, fuelAge, heritageType, ...)
        │
        ▼
standardize_risk_inputs()          ← risk_normalization.py
        │
        ▼
{slopeRisk, fuelRisk, graniteInfluence, heritageTypeRisk, burnContext}
        │
        ├──▶ calculate_site_score()     ← site_assessment.py  (Heritage Vulnerability)
        │         weights: fuel×0.45, slope×0.25, heritage×0.25, burn×0.05
        │
        └──▶ Area Vulnerability formula ← metadata.json
                  weights: fuel×0.55, slope×0.35, granite×0.10
```

After the heritage Blueprint is registered, heritage site records accessed via `/api/heritage` can also be piped through `standardize_risk_inputs()` to generate model-ready scores for batch assessment or map overlay generation.
