# Fire Vulnerability MVP

Prototype web app for viewing fire vulnerability and GIS layers around heritage places in the FRK study area.

## What This MVP Does

- Uses an Australia/Wester Australia base map with selectable overlay layers.
- Shows granite influence, fuel type, slope, heritage, burn options, and fire vulnerability.
- Filters Aboriginal and non-Aboriginal heritage places to the FRK study area.
- Samples the slope and bushfire fuel rasters at a representative point inside each heritage polygon.
- Calculates simple 0-100 vulnerability scores for heritage places and prototype risk-area cells.
- Serves a static Leaflet map with multi-select layer controls and click-through details.

## Score Formula

```text
Fire Vulnerability Score =
Fuel Risk * 0.50
+ Slope Risk * 0.30
+ Heritage Sensitivity * 0.10
+ Burn Management Context * 0.10
```

Levels:

```text
0-33    Low
34-66   Medium
67-100  High
```

This is a course-prototype score, not an official bushfire warning or operational risk product.

## Build The Processed Data

```bash
.venv/bin/python scripts/preprocess_mvp_data.py
```

Outputs:

- `data/processed/fire_vulnerability_layer.geojson`
- `data/processed/heritage_all_layer.geojson`
- `data/processed/burn_options_layer.geojson`
- `data/processed/granite_layer.geojson`
- `data/processed/fuel_type_layer.geojson`
- `data/processed/slope_layer.geojson`
- `data/processed/metadata.json`

## Run The Web App

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/web/
```

## Source Data

The script reads source files from:

```text
/Users/tobinyao/Desktop/2026 s1/IT capstone/
```

Raw data is not copied into this repository. Only lightweight processed outputs are generated here.
