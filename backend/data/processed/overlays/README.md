# Processed Overlay Outputs

This folder is reserved for processed raster or grid overlay outputs used by the fire vulnerability models.

Large raster files should not be committed unless the team confirms they are small enough, non-sensitive, and required for the MVP demo.

## Suggested Raster / Grid Names

```text
slope_risk.tif
fuel_risk.tif
granite_influence.tif
burn_context.tif
area_vulnerability.tif
heritage_vulnerability.tif
```

## Expected Score Range

All risk overlays should use a 0-100 score range where:

- `0` means no or very low contribution to vulnerability
- `100` means very high contribution to vulnerability

## Documentation Requirement

Each overlay should be documented in `../metadata.processed.sample.json` or a generated metadata file with:

- source layer
- processing date
- score range
- resolution or geometry type
- model role
- assumptions
