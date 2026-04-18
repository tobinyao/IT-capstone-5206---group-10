# FRK Fire Vulnerability Web GIS MVP

## 1. Project Overview

This MVP is a web-based GIS prototype designed to support fire vulnerability assessment for heritage places in the FRK study area in southern Western Australia.

The current prototype focuses on helping rangers, heritage researchers, and project stakeholders explore how bushfire-related environmental factors may affect Aboriginal and non-Aboriginal heritage places. It is not intended to be an official fire warning system or an operational emergency response product. Instead, it is a decision-support and discussion tool for early-stage project validation.

The MVP combines heritage data, fuel type, slope, burn option areas, and granite influence into a single interactive map. Users can switch layers on and off, zoom into local areas, inspect heritage places, and compare fire vulnerability patterns across the FRK region.

## 2. What Has Been Built

The current MVP includes:

- A real road basemap using OpenStreetMap, allowing users to zoom into the FRK area and view roads, towns, and local geographic context.
- A fire vulnerability overlay showing Low, Medium, and High vulnerability areas.
- A heritage places layer containing both Aboriginal and non-Aboriginal heritage places within the FRK study area.
- Clickable heritage markers and polygons with key heritage and vulnerability information.
- A burn options layer showing DBCA burn option areas as management context.
- A granite influence layer derived from the interpreted bedrock geology dataset.
- A fuel type layer showing fuel and vegetation structure categories.
- A slope layer showing slope-related fire spread conditions.
- A layer control panel so users can turn individual map layers on or off.
- A colour key explaining the meaning of each visible layer.
- Basic filtering for heritage places by vulnerability level and heritage type.

## 3. Intended Users

The prototype is primarily intended for:

- Rangers and land managers who need to understand where heritage places may overlap with elevated fire exposure.
- Heritage researchers who need spatial context around Aboriginal and non-Aboriginal heritage places.
- Project clients and stakeholders who need to review whether the proposed data layers and scoring logic are useful.
- Course assessors or reviewers who need to see a working MVP demonstrating geospatial data integration and risk visualisation.

## 4. Study Area

The MVP focuses on the FRK region in southern Western Australia. In the web app, the FRK study area is shown with a dashed boundary. The map opens directly to this region rather than showing the whole of Australia.

The FRK region is treated as the main study area. All processed heritage, burn option, geology, fuel, slope, and fire vulnerability outputs are clipped or filtered to this area.

## 5. Current Map Layers

### 5.1 Fire Vulnerability

The Fire Vulnerability layer is the main risk surface. It shows relative vulnerability across the FRK area using three colours:

- Red: High vulnerability
- Yellow: Medium vulnerability
- Green: Low vulnerability

The current fire vulnerability surface is calculated from:

```text
Area Fire Vulnerability = Fuel Risk 60% + Slope Risk 40%
```

The High category is calibrated to represent approximately the highest-risk 5% of the FRK area. This makes the map more useful for visual comparison within the study area instead of classifying almost everything as Medium.

### 5.2 Heritage Places

The Heritage Places layer includes both:

- Aboriginal heritage places
- Non-Aboriginal State Register heritage places

Each heritage record is represented using its available polygon geometry and a clickable representative point. For large or sensitive Aboriginal heritage polygons, the representative point acts as an equivalent clickable location while still preserving the polygon context.

When a user clicks a heritage place, the app displays key information such as:

- Identifier
- Name
- Heritage type
- Status
- Place type
- Region or LGA
- Fuel class
- Slope information
- Heritage material/type risk
- Burn option context
- Vulnerability score
- Vulnerability level

### 5.3 Burn Options

The Burn Options layer shows DBCA burn option areas within the FRK region.

This layer is used as management context. It helps users see whether a heritage place or high-risk area overlaps with a planned or proposed burn management area.

Important note: this layer is not treated as live fire protection status and should not be interpreted as current operational fire management coverage.

### 5.4 Granite Influence

The Granite Influence layer was extracted from the 1:500k interpreted bedrock geology dataset. The prototype filters geology units where the geology attributes indicate granite or granitoid-related formations.

This layer is included because geology may be relevant to heritage research, especially where certain heritage types are associated with rock formations, shelters, engravings, or other geological contexts. It is also included as a 10% context factor in the area-level Fire Vulnerability score. It should be interpreted as geology context, not field-confirmed surface outcrop.

### 5.5 Fuel Type

The Fuel Type layer is based on the Bushfire Fuel Classification dataset. It shows vegetation and fuel structure categories such as:

- Forest / woodland
- Shrubland
- Grassland / cropland
- Wetland / water
- Built-up / bare ground

Fuel type is not the same as final vulnerability. Instead, each fuel type is mapped to a fuel risk score. Higher-risk fuels include dense forest, pine plantation, shrubland, and woodland with shrubby understory. Lower-risk fuels include water, bare ground, built-up areas, and sparse grassland.

### 5.6 Slope

The Slope layer is derived from the slope raster generated from DEM data. It represents topographic influence on fire spread.

Slope is grouped into broad risk categories:

- Low
- Moderate
- Steep
- Very steep

Steeper slopes generally contribute to higher fire spread risk.

## 6. Heritage Vulnerability Scoring

Each heritage place receives an individual vulnerability score. The current scoring model is:

```text
Heritage Vulnerability =
Fuel Risk 45%
+ Slope Risk 25%
+ Heritage Type / Material Risk 25%
+ Burn Context 5%
```

This model was adjusted after review because some heritage points near the edge of the slope raster had unknown slope values. Previously, unknown slope could still allow a place to be classified as High. The current version prevents heritage places with unknown slope from being classified as High until the missing slope data is reviewed.

The model now considers three major factors:

- Fuel type around the heritage place
- Slope at the heritage place
- Heritage type or material vulnerability

Burn option context is included with a smaller weight because it provides management context rather than direct fire exposure.

## 7. Heritage Type / Material Risk

The MVP includes a simple rule-based material/type risk classification.

Examples:

- Modified tree, timber, wood, or wooden structures: higher risk
- Painting, rock art, engraving, or rock shelter: high risk
- Burial, grave, or cemetery: moderately high risk
- Midden or organic deposit: medium to moderately high risk
- Artefact scatter, quarry, grinding area, groove, or sub-surface material: lower to medium risk
- Brick, stone, masonry, or concrete: lower material vulnerability
- General built heritage: medium risk

This is a prototype classification. It should be reviewed with heritage experts and client stakeholders before being used for formal analysis.

## 8. Data Sources Used

The MVP currently uses the following source datasets:

- Aboriginal Cultural Heritage Register GeoJSON
- Aboriginal Cultural Heritage Lodged GeoJSON
- Heritage Council State Register GeoJSON
- ACH register and lodged CSV attribute information
- DBCA Burn Options Program GeoJSON
- Bushfire Fuel Classification GeoTIFF
- Fuel type classification PDF / attribute table
- Slope GeoTIFF derived from DEM
- 1 Second DEM
- 1:500k Interpreted Bedrock Geology shapefile

The raw source datasets remain outside the project folder. The app uses processed lightweight outputs generated into the project folder.

## 9. Processed Outputs

The MVP generates browser-friendly outputs such as:

- `heritage_all_layer.geojson`
- `burn_options_layer.geojson`
- `granite_layer.geojson`
- `fire_vulnerability_overlay.png`
- `fuel_type_overlay.png`
- `slope_overlay.png`
- `metadata.json`

The raster overlays are generated as image layers so the browser can display approximately 50-60 metre visual detail without loading thousands or millions of vector grid cells.

## 10. Current Strengths

The current MVP demonstrates:

- Successful integration of multiple spatial datasets.
- Real interactive map navigation with road-level context.
- Layer-based exploration of fire vulnerability, fuel, slope, geology, burn options, and heritage.
- Clickable heritage information.
- A transparent and explainable scoring method.
- A working prototype suitable for client feedback collection.

## 11. Current Limitations

The MVP still has several limitations:

- The fire vulnerability model is a simplified prototype, not a validated scientific model.
- Fuel risk values are rule-based and should be reviewed with fire ecology or land management experts.
- Heritage type/material risk is based on keyword rules and should be validated with heritage specialists.
- Unknown slope values are currently capped to avoid over-classification, but these records should be reviewed spatially.
- Burn options are treated as context only, not as live operational fire mitigation status.
- The raster overlays are visual layers; clicking them does not yet return cell-level score information.
- The current app is local only and not deployed as a production web service.

## 12. Questions For Client Feedback

During the MVP demonstration, useful feedback questions include:

1. Are the current map layers useful for your workflow?
2. Is the FRK study area shown at the correct extent?
3. Are the heritage attributes shown on click sufficient?
4. Should Aboriginal and non-Aboriginal heritage be shown together or separated by default?
5. Are the fire vulnerability colours easy to interpret?
6. Is the current High / Medium / Low classification useful?
7. Should High risk represent approximately the top 5% of the area, or should another threshold be used?
8. Does the material/type risk logic make sense for heritage protection?
9. Which heritage types should be treated as most vulnerable to fire?
10. Should burn option areas reduce risk, increase concern, or only appear as context?
11. Are there missing data layers that should be added?
12. What export or reporting features would be valuable in the next version?

## 13. Suggested Demo Flow

Suggested presentation sequence:

1. Introduce the purpose of the MVP.
2. Explain that FRK is the study area and the app opens directly to this region.
3. Show the road basemap and zoom/pan interaction.
4. Turn on Fire Vulnerability and explain the red/yellow/green categories.
5. Turn on Heritage Places and click several heritage records.
6. Explain how heritage vulnerability is calculated.
7. Show Burn Options and discuss how it provides management context.
8. Show Fuel Type and Slope to explain the environmental inputs.
9. Show Granite Influence as a heritage research context layer.
10. Discuss limitations and ask client feedback questions.

## 14. Next Development Options

Possible next steps include:

- Add click-to-query for fire vulnerability, fuel, and slope raster overlays.
- Add search by heritage name or identifier.
- Add a table view of high-risk heritage places.
- Add exportable reports for selected heritage places.
- Improve the scoring model with client-approved weights.
- Add buffer analysis around heritage places.
- Add confidence or data quality indicators.
- Deploy the MVP to a shared web server for easier stakeholder access.
