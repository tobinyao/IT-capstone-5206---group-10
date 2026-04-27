# Processed Data Outputs

This directory defines the MVP output structure for processed heritage and environmental data.

The purpose is to keep processed outputs separate from raw source data and provide a clear convention for model-ready GeoJSON, raster overlays, and processed metadata.

## Directory Structure

```text
backend/data/processed/
  README.md
  metadata.processed.sample.json
  geojson/
    heritage_sites.sample.geojson
    burn_options.sample.geojson
  overlays/
    README.md
```

## Expected Outputs

- `geojson/heritage_sites.sample.geojson`: sample or anonymised heritage site points with model-ready attributes.
- `geojson/burn_options.sample.geojson`: sample burn option polygons or burn management areas.
- `overlays/`: reserved for raster or grid outputs such as slope risk, fuel risk, granite influence, and area vulnerability layers.
- `metadata.processed.sample.json`: summary of processed layer counts, sensitivity status, assumptions, and expected score ranges.

## Sensitivity Rule

Real Aboriginal heritage location data may be sensitive. Do not commit real protected coordinates unless the project has explicit permission. Use sample, anonymised, or generalised coordinates for MVP demonstrations.

## Model-Ready Field Convention

Processed heritage features should use consistent field names:

- `id`
- `name`
- `heritageType`
- `source`
- `slope`
- `fuelRisk`
- `graniteInfluence`
- `burnContext`
- `heritageTypeRisk`

These fields support the Area Fire Vulnerability and Heritage Vulnerability models.
