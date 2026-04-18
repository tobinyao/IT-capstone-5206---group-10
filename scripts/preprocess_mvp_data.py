#!/usr/bin/env python3
"""Prepare GIS-style MVP layers for the fire vulnerability web app."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio
import shapefile
from PIL import Image
from pyproj import Transformer
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from rasterio.warp import reproject, transform_bounds
from shapely.geometry import box, mapping, shape


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path("/Users/tobinyao/Desktop/2026 s1/IT capstone")
PROCESSED = ROOT / "data" / "processed"
APP_CRS = "EPSG:7844"
OVERLAY_WIDTH = 2200

REGISTER_GEOJSON = SOURCE_ROOT / (
    "Aboriginal_Cultural_Heritage_Register_DPLH_099_WA_GDA2020_Public_Secure_GeoJSON/"
    "Aboriginal_Cultural_Heritage_Register_DPLH_099_WA_GDA2020_Public_Secure.geojson"
)
LODGED_GEOJSON = SOURCE_ROOT / (
    "Aboriginal_Cultural_Heritage_Lodged_DPLH_100_WA_GDA2020_Public_Secure_GeoJSON/"
    "Aboriginal_Cultural_Heritage_Lodged_DPLH_100_WA_GDA2020_Public_Secure.geojson"
)
STATE_HERITAGE_GEOJSON = SOURCE_ROOT / (
    "Heritage_Council_State_Register_DPLH_006_WA_GDA2020_Public_Secure_GeoJSON/"
    "Heritage_Council_State_Register_DPLH_006_WA_GDA2020_Public_Secure.geojson"
)
BURN_GEOJSON = SOURCE_ROOT / (
    "DBCA_Burn_Options_Program_DBCA_007_WA_GDA2020_Public_GeoJSON/"
    "DBCA_Burn_Options_Program_DBCA_007_WA_GDA2020_Public.geojson"
)
GEOLOGY_SHP = SOURCE_ROOT / (
    "GEOLOGY_500k_InterpretedBedrockGeology_GDA2020_SHP/ESRI/SHAPEFILES/500k_interpgeop.shp"
)
SLOPE_TIF = SOURCE_ROOT / "Slope-cal/slope_FRK_output.tif"
FUEL_TIF = SOURCE_ROOT / "fuel_type_cal/Bushfire fuel classification fuel types map release 2.tif"

FUEL_CLASSES = {
    110: "Tall, closed forest",
    120: "Closed forest",
    210: "Tall open forest",
    220: "Open forest",
    230: "Low open forest",
    310: "Broadleaf plantation",
    321: "Radiata pine",
    322: "Maritime pine",
    323: "Southern pine",
    324: "Other conifer",
    330: "Other plantation",
    411: "Tall woodland with grassy understory",
    421: "Woodland with shrubby understory",
    422: "Woodland with spinifex understory",
    423: "Woodland with grassy understory",
    424: "Woodland with sparse understory",
    431: "Low woodland with shrubby understory",
    432: "Low woodland with spinifex understory",
    433: "Low woodland with grassy understory",
    434: "Low woodland with sparse understory",
    510: "Tall shrubland",
    520: "Shrubland",
    531: "Open shrubland with spinifex understory",
    532: "Open shrubland with grassy understory",
    533: "Open shrubland with sparse understory",
    610: "Sedgeland",
    620: "Hummock grassland",
    631: "Grassland",
    632: "Open grassland",
    633: "Sparse grassland",
    640: "Croplands",
    700: "Horticulture",
    800: "Wetlands",
    910: "Water",
    920: "Wildland urban interface 1",
    930: "Wildland urban interface 2",
    940: "Wildland urban interface 3",
    950: "Built-up",
    960: "Bare ground",
}

FUEL_RISK = {
    110: 100,
    120: 96,
    210: 92,
    220: 86,
    230: 76,
    310: 82,
    321: 96,
    322: 94,
    323: 94,
    324: 90,
    330: 80,
    411: 76,
    421: 84,
    422: 82,
    423: 72,
    424: 62,
    431: 78,
    432: 76,
    433: 66,
    434: 56,
    510: 88,
    520: 82,
    531: 74,
    532: 68,
    533: 54,
    610: 58,
    620: 74,
    631: 62,
    632: 48,
    633: 34,
    640: 50,
    700: 52,
    800: 35,
    910: 5,
    920: 82,
    930: 70,
    940: 58,
    950: 26,
    960: 12,
}

SENSITIVE_TYPE_WEIGHTS = {
    "burial": 24,
    "creation": 20,
    "dreaming": 20,
    "painting": 18,
    "engraving": 16,
    "rock shelter": 16,
    "grinding": 14,
    "ceremonial": 20,
    "water source": 12,
}

MATERIAL_RULES = [
    (("modified tree", "tree", "wood", "timber", "wooden"), 95, "Wood or tree-based heritage"),
    (("painting", "rock art", "art", "engraving", "rock shelter"), 86, "Rock art / rock shelter"),
    (("burial", "grave", "cemetery"), 76, "Burial or grave"),
    (("ceremonial", "creation", "dreaming", "mythological"), 72, "Ceremonial / narrative place"),
    (("midden", "shell"), 62, "Midden or organic deposit"),
    (("camp", "historical", "water source"), 60, "Camp / historical / water source"),
    (("sub surface", "artefact", "scatter", "quarry", "grinding", "groove"), 52, "Stone or sub-surface material"),
    (("brick", "stone", "masonry", "concrete"), 46, "Masonry / stone / concrete built fabric"),
    (("house", "cottage", "hall", "church", "hotel", "school", "station", "homestead", "building"), 72, "Built heritage fabric"),
    (("jetty", "bridge", "mill", "railway"), 78, "Infrastructure heritage fabric"),
]


def feature_collection(name: str, features: list[dict]) -> dict:
    return {"type": "FeatureCollection", "name": name, "features": features}


def write_geojson(name: str, collection: dict) -> None:
    (PROCESSED / name).write_text(json.dumps(collection), encoding="utf-8")


def clamp(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, round(value)))


def level(score: int) -> str:
    if score >= 67:
        return "High"
    if score >= 34:
        return "Medium"
    return "Low"


def slope_risk(slope_degrees: float | None) -> int:
    if slope_degrees is None:
        return 35
    if slope_degrees <= 5:
        return 12
    if slope_degrees <= 15:
        return round(12 + (slope_degrees - 5) * 3.8)
    if slope_degrees <= 25:
        return round(50 + (slope_degrees - 15) * 3.5)
    return 100


def slope_class(slope_degrees: float | None) -> str:
    if slope_degrees is None:
        return "Unknown"
    if slope_degrees <= 5:
        return "Low slope"
    if slope_degrees <= 15:
        return "Moderate slope"
    if slope_degrees <= 25:
        return "Steep slope"
    return "Very steep slope"


def heritage_sensitivity(props: dict) -> int:
    score = 40
    heritage_kind = props.get("heritage_kind")
    if heritage_kind == "Aboriginal":
        score += 8
    if props.get("place_status") in {"Register", "State Register Place"}:
        score += 12
    elif props.get("place_status") == "Lodged":
        score += 6

    if props.get("culturally_sensitive") == "Yes":
        score += 18
    if props.get("restricted_place") == "Yes":
        score += 10
    if props.get("boundary_reliable") in {"No", None}:
        score += 4

    place_type = (props.get("place_type") or "").lower()
    for keyword, weight in SENSITIVE_TYPE_WEIGHTS.items():
        if keyword in place_type:
            score += weight
            break
    return clamp(score)


def heritage_type_risk(props: dict) -> tuple[int, str]:
    text = " ".join(
        str(props.get(key) or "")
        for key in ["place_type", "name", "location", "place_status"]
    ).lower()
    for keywords, score, label in MATERIAL_RULES:
        if any(keyword in text for keyword in keywords):
            return score, label
    if props.get("heritage_kind") == "Non-Aboriginal":
        return 68, "General built heritage fabric"
    if props.get("heritage_kind") == "Aboriginal":
        return 64, "General Aboriginal heritage place"
    return 60, "General heritage place"


def heritage_level(score: int, slope_value: float | None) -> str:
    if slope_value is None and score >= 67:
        return "Medium"
    return level(score)


def sample_raster(dataset, transformer: Transformer, lon: float, lat: float):
    x, y = transformer.transform(lon, lat)
    bounds = dataset.bounds
    if x < bounds.left or x > bounds.right or y < bounds.bottom or y > bounds.top:
        return None
    value = next(dataset.sample([(x, y)]))[0]
    if dataset.nodata is not None and value == dataset.nodata:
        return None
    return value.item() if hasattr(value, "item") else value


def fuel_props(fuel_code: int | None) -> dict:
    return {
        "fuel_code": fuel_code,
        "fuel_class": FUEL_CLASSES.get(fuel_code, "Unknown or no fuel data"),
        "fuel_risk": FUEL_RISK.get(fuel_code, 55),
    }


def grid_score(fuel_code: int | None, slope_value: float | None, granite_influence: float = 0) -> tuple[int, str]:
    score = clamp(
        FUEL_RISK.get(fuel_code, 55) * 0.55
        + slope_risk(slope_value) * 0.35
        + granite_influence * 0.10
    )
    return score, level(score)


def level_from_thresholds(score: float, low_threshold: float, high_threshold: float) -> str:
    if score >= high_threshold:
        return "High"
    if score < low_threshold:
        return "Low"
    return "Medium"


def clean_geometry(geom):
    if geom.is_empty:
        return None
    if not geom.is_valid:
        geom = geom.buffer(0)
    if geom.is_empty:
        return None
    return geom


def load_burn_layer(analysis_area):
    data = json.loads(BURN_GEOJSON.read_text())
    features = []
    geometries = []
    for feature in data["features"]:
        geom_raw = feature.get("geometry")
        if not geom_raw:
            continue
        geom = clean_geometry(shape(geom_raw))
        if geom is None or not geom.intersects(analysis_area):
            continue
        clipped = geom.intersection(analysis_area)
        simplified = clipped.simplify(0.001, preserve_topology=True)
        props = feature.get("properties", {})
        geometries.append(geom)
        features.append(
            {
                "type": "Feature",
                "geometry": mapping(simplified),
                "properties": {
                    "layer": "Burn option",
                    "burnid": props.get("burnid"),
                    "location": props.get("location"),
                    "status": props.get("status"),
                    "priority": props.get("priority"),
                    "fin_yr": props.get("fin_yr"),
                    "purpose": props.get("purpose"),
                },
            }
        )
    return geometries, features


def normalize_aboriginal_props(raw: dict, source: str) -> dict:
    return {
        "layer": "Heritage",
        "heritage_kind": "Aboriginal",
        "id": raw.get("id"),
        "identifier": raw.get("ach_identifier"),
        "name": raw.get("name") or "Unnamed Aboriginal heritage place",
        "place_status": raw.get("place_status") or source,
        "place_type": raw.get("place_type") or "Unknown",
        "region": raw.get("region") or "Unknown",
        "culturally_sensitive": raw.get("culturally_sensitive") or "Unknown",
        "restricted_place": raw.get("restricted_place") or "Unknown",
        "boundary_reliable": raw.get("boundary_reliable") or "Unknown",
        "source": source,
    }


def normalize_state_props(raw: dict) -> dict:
    return {
        "layer": "Heritage",
        "heritage_kind": "Non-Aboriginal",
        "id": raw.get("place_no"),
        "identifier": str(raw.get("place_no") or "Unknown"),
        "name": raw.get("place_name") or "Unnamed state heritage place",
        "place_status": raw.get("her_record") or "State heritage",
        "place_type": "State heritage place",
        "region": raw.get("lga") or "Unknown",
        "culturally_sensitive": "Not applicable",
        "restricted_place": "Unknown",
        "boundary_reliable": "Unknown",
        "location": raw.get("location") or "Unknown",
        "more_info": raw.get("more_info"),
        "source": "State Register",
    }


def score_heritage_feature(feature: dict, props: dict, analysis_area, slope_ds, fuel_ds, burn_geometries):
    geom_raw = feature.get("geometry")
    if not geom_raw:
        return None, "missing_geometry"
    geom = clean_geometry(shape(geom_raw))
    if geom is None:
        return None, "empty_geometry"
    minx, miny, maxx, maxy = geom.bounds
    if minx < 100 or maxx > 135 or miny < -40 or maxy > -10:
        return None, "outside_wa_or_bad_coords"
    if not geom.intersects(analysis_area):
        return None, "outside_analysis_area"

    clipped = clean_geometry(geom.intersection(analysis_area))
    if clipped is None:
        return None, "empty_after_clip"

    point = clipped.representative_point()
    lon, lat = point.x, point.y
    slope_transformer = Transformer.from_crs(APP_CRS, slope_ds.crs, always_xy=True)
    fuel_transformer = Transformer.from_crs(APP_CRS, fuel_ds.crs, always_xy=True)
    slope_value = sample_raster(slope_ds, slope_transformer, lon, lat)
    fuel_value = sample_raster(fuel_ds, fuel_transformer, lon, lat)
    fuel_code = int(fuel_value) if fuel_value is not None else None

    fuel_info = fuel_props(fuel_code)
    slope_value_float = float(slope_value) if slope_value is not None else None
    slope_score = slope_risk(slope_value_float)
    heritage_score = heritage_sensitivity(props)
    heritage_type_score, heritage_type_label = heritage_type_risk(props)
    in_burn_option = any(burn_geom.contains(point) or burn_geom.touches(point) for burn_geom in burn_geometries)
    burn_score = 35 if in_burn_option else 65
    final_score = clamp(
        fuel_info["fuel_risk"] * 0.45
        + slope_score * 0.25
        + heritage_type_score * 0.25
        + burn_score * 0.05
    )
    if slope_value_float is None and final_score >= 67:
        final_score = 66

    simplified = clipped.simplify(0.0007, preserve_topology=True)
    return (
        {
            "type": "Feature",
            "geometry": mapping(simplified),
            "properties": {
                **props,
                "longitude": round(lon, 6),
                "latitude": round(lat, 6),
                **fuel_info,
                "slope_degrees": round(slope_value_float, 2) if slope_value_float is not None else None,
                "slope_class": slope_class(slope_value_float),
                "slope_risk": slope_score,
                "heritage_sensitivity": heritage_score,
                "heritage_type_risk": heritage_type_score,
                "heritage_type_risk_label": heritage_type_label,
                "slope_data_quality": "Unavailable at sampled point; high classification capped" if slope_value_float is None else "Sampled from slope raster",
                "burn_management_context": "Inside DBCA burn option area" if in_burn_option else "No burn option overlap",
                "burn_management_risk": burn_score,
                "vulnerability_score": final_score,
                "vulnerability_level": heritage_level(final_score, slope_value_float),
            },
        },
        None,
    )


def load_heritage_layer(analysis_area, slope_ds, fuel_ds, burn_geometries):
    output = []
    skipped = Counter()
    for path, source in [(REGISTER_GEOJSON, "Register"), (LODGED_GEOJSON, "Lodged")]:
        data = json.loads(path.read_text())
        for feature in data["features"]:
            scored, reason = score_heritage_feature(
                feature,
                normalize_aboriginal_props(feature.get("properties", {}), source),
                analysis_area,
                slope_ds,
                fuel_ds,
                burn_geometries,
            )
            if scored:
                output.append(scored)
            else:
                skipped[f"{source}:{reason}"] += 1

    data = json.loads(STATE_HERITAGE_GEOJSON.read_text())
    for feature in data["features"]:
        scored, reason = score_heritage_feature(
            feature,
            normalize_state_props(feature.get("properties", {})),
            analysis_area,
            slope_ds,
            fuel_ds,
            burn_geometries,
        )
        if scored:
            output.append(scored)
        else:
            skipped[f"State Register:{reason}"] += 1

    return output, skipped


def load_granite_layer(analysis_area):
    reader = shapefile.Reader(str(GEOLOGY_SHP))
    features = []
    geometries = []
    search_fields = [
        "UNITNAME",
        "DESCRIPTN",
        "ROCKTYPE1",
        "LITHNAME1",
        "ROCKTYPE2",
        "LITHNAME2",
        "EVENTS",
        "SYMBOL",
    ]
    for item in reader.iterShapeRecords():
        props = item.record.as_dict()
        haystack = " ".join(str(props.get(field) or "") for field in search_fields).lower()
        if "gran" not in haystack:
            continue
        geom = clean_geometry(shape(item.shape.__geo_interface__))
        if geom is None or not geom.intersects(analysis_area):
            continue
        clipped = clean_geometry(geom.intersection(analysis_area))
        if clipped is None:
            continue
        geometries.append(clipped)
        features.append(
            {
                "type": "Feature",
                "geometry": mapping(clipped.simplify(0.001, preserve_topology=True)),
                "properties": {
                    "layer": "Granite influence",
                    "unit_name": props.get("UNITNAME"),
                    "code": props.get("CODE"),
                    "description": props.get("DESCRIPTN"),
                    "rock_type": props.get("ROCKTYPE1"),
                    "lithology": props.get("LITHNAME1"),
                },
            }
        )
    return features, geometries


def build_grid_layers(analysis_area, slope_ds, fuel_ds, granite_geometries):
    slope_transformer = Transformer.from_crs(APP_CRS, slope_ds.crs, always_xy=True)
    fuel_transformer = Transformer.from_crs(APP_CRS, fuel_ds.crs, always_xy=True)
    west, south, east, north = analysis_area.bounds
    step = 0.025
    fuel_features = []
    slope_features = []
    fire_features = []
    raw_cells = []
    y = south
    while y < north:
        x = west
        while x < east:
            cell = box(x, y, min(x + step, east), min(y + step, north))
            center = cell.centroid
            fuel_value = sample_raster(fuel_ds, fuel_transformer, center.x, center.y)
            slope_value = sample_raster(slope_ds, slope_transformer, center.x, center.y)
            fuel_code = int(fuel_value) if fuel_value is not None else None
            slope_value_float = float(slope_value) if slope_value is not None else None
            if fuel_code is None and slope_value_float is None:
                x += step
                continue

            fuel_info = fuel_props(fuel_code)
            slope_score = slope_risk(slope_value_float)
            geometry = mapping(cell)
            granite_influence = 100 if any(geom.intersects(cell) for geom in granite_geometries) else 0
            if fuel_code is not None and slope_value_float is not None:
                fire_score, _ = grid_score(fuel_code, slope_value_float, granite_influence)
                raw_cells.append((geometry, fuel_info, slope_value_float, slope_score, granite_influence, fire_score))

            if fuel_code is not None:
                fuel_features.append(
                    {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "layer": "Fuel type",
                            **fuel_info,
                        },
                    }
                )
            if slope_value_float is not None:
                slope_features.append(
                    {
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": {
                            "layer": "Slope",
                            "slope_degrees": round(slope_value_float, 2),
                            "slope_class": slope_class(slope_value_float),
                            "slope_risk": slope_score,
                        },
                    }
                )
            x += step
        y += step

    scores = np.array([cell[5] for cell in raw_cells], dtype=np.float32)
    low_threshold = float(np.percentile(scores, 35)) if len(scores) else 34.0
    high_threshold = float(np.percentile(scores, 95)) if len(scores) else 67.0
    for geometry, fuel_info, slope_value_float, slope_score, granite_influence, fire_score in raw_cells:
        fire_features.append(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "layer": "Fire vulnerability",
                    **fuel_info,
                    "slope_degrees": round(slope_value_float, 2) if slope_value_float is not None else None,
                    "slope_risk": slope_score,
                    "granite_influence": granite_influence,
                    "vulnerability_score": fire_score,
                    "vulnerability_level": level_from_thresholds(fire_score, low_threshold, high_threshold),
                },
            }
        )
    return fuel_features, slope_features, fire_features


def fuel_rgb(code: int | None) -> tuple[int, int, int]:
    if code is None:
        return 157, 163, 166
    if code >= 900:
        return 135, 145, 154
    if code >= 800:
        return 85, 166, 162
    if code >= 600:
        return 191, 170, 54
    if code >= 500:
        return 180, 95, 76
    if code >= 400:
        return 111, 157, 88
    if code >= 300:
        return 78, 127, 94
    if code >= 200:
        return 47, 127, 105
    if code >= 100:
        return 35, 107, 69
    return 157, 163, 166


def risk_rgb(score: float) -> tuple[int, int, int]:
    if score >= 67:
        return 196, 62, 47
    if score >= 34:
        return 210, 155, 34
    return 63, 139, 91


def slope_rgb(score: float) -> tuple[int, int, int]:
    if score >= 80:
        return 182, 47, 42
    if score >= 55:
        return 215, 141, 38
    if score >= 30:
        return 200, 185, 54
    return 88, 166, 109


def save_rgba_png(path: Path, rgba: np.ndarray) -> None:
    Image.fromarray(rgba.astype(np.uint8), mode="RGBA").save(path)


def build_raster_overlays(analysis_area, slope_ds, fuel_ds, granite_geometries):
    west, south, east, north = analysis_area.bounds
    height = round(OVERLAY_WIDTH * ((north - south) / (east - west)))
    transform = from_bounds(west, south, east, north, OVERLAY_WIDTH, height)

    fuel = np.zeros((height, OVERLAY_WIDTH), dtype=np.int32)
    slope = np.full((height, OVERLAY_WIDTH), -9999.0, dtype=np.float32)

    reproject(
        source=rasterio.band(fuel_ds, 1),
        destination=fuel,
        src_transform=fuel_ds.transform,
        src_crs=fuel_ds.crs,
        src_nodata=fuel_ds.nodata,
        dst_transform=transform,
        dst_crs=APP_CRS,
        dst_nodata=0,
        resampling=Resampling.nearest,
    )
    reproject(
        source=rasterio.band(slope_ds, 1),
        destination=slope,
        src_transform=slope_ds.transform,
        src_crs=slope_ds.crs,
        src_nodata=slope_ds.nodata,
        dst_transform=transform,
        dst_crs=APP_CRS,
        dst_nodata=-9999,
        resampling=Resampling.bilinear,
    )

    valid_fuel = fuel != 0
    valid_slope = slope > -1000
    valid_fire = valid_fuel & valid_slope
    granite_influence_array = rasterize(
        [(mapping(geom), 100) for geom in granite_geometries],
        out_shape=(height, OVERLAY_WIDTH),
        transform=transform,
        fill=0,
        dtype=np.uint8,
        all_touched=True,
    ).astype(np.float32)

    fuel_risk_array = np.full_like(slope, 55.0, dtype=np.float32)
    for code, risk in FUEL_RISK.items():
        fuel_risk_array[fuel == code] = risk
    slope_risk_array = np.full_like(slope, 50.0, dtype=np.float32)
    slope_risk_array[valid_slope & (slope <= 5)] = 12
    mask = valid_slope & (slope > 5) & (slope <= 15)
    slope_risk_array[mask] = 12 + (slope[mask] - 5) * 3.8
    mask = valid_slope & (slope > 15) & (slope <= 25)
    slope_risk_array[mask] = 50 + (slope[mask] - 15) * 3.5
    slope_risk_array[valid_slope & (slope > 25)] = 100

    fire_score = np.clip(
        fuel_risk_array * 0.55
        + slope_risk_array * 0.35
        + granite_influence_array * 0.10,
        0,
        100,
    )

    fire_rgba = np.zeros((height, OVERLAY_WIDTH, 4), dtype=np.uint8)
    fuel_rgba = np.zeros_like(fire_rgba)
    slope_rgba = np.zeros_like(fire_rgba)

    valid_scores = fire_score[valid_fire]
    low_threshold = float(np.percentile(valid_scores, 35)) if valid_scores.size else 34.0
    high_threshold = float(np.percentile(valid_scores, 95)) if valid_scores.size else 67.0

    low_mask = valid_fire & (fire_score < low_threshold)
    medium_mask = valid_fire & (fire_score >= low_threshold) & (fire_score < high_threshold)
    high_mask = valid_fire & (fire_score >= high_threshold)
    fire_rgba[low_mask, :3] = (20, 150, 75)
    fire_rgba[medium_mask, :3] = (235, 174, 38)
    fire_rgba[high_mask, :3] = (210, 48, 42)
    fire_rgba[valid_fire, 3] = 168

    for code in np.unique(fuel[valid_fuel]):
        fuel_rgba[fuel == code, :3] = fuel_rgb(int(code))
    fuel_rgba[valid_fuel, 3] = 118

    for low, high, color in [
        (-999, 30, (88, 166, 109)),
        (30, 55, (200, 185, 54)),
        (55, 80, (215, 141, 38)),
        (80, 101, (182, 47, 42)),
    ]:
        mask = valid_slope & (slope_risk_array >= low) & (slope_risk_array < high)
        slope_rgba[mask, :3] = color
    slope_rgba[valid_slope, 3] = 116

    save_rgba_png(PROCESSED / "fire_vulnerability_overlay.png", fire_rgba)
    save_rgba_png(PROCESSED / "fuel_type_overlay.png", fuel_rgba)
    save_rgba_png(PROCESSED / "slope_overlay.png", slope_rgba)

    metres_per_pixel = 111_320 * (east - west) / OVERLAY_WIDTH
    return {
        "bounds_epsg_7844": [west, south, east, north],
        "width": OVERLAY_WIDTH,
        "height": height,
        "approx_metres_per_pixel": round(metres_per_pixel, 1),
        "classification": {
            "method": "FRK relative distribution using fuel, slope, and granite influence",
            "low": f"score < {low_threshold:.1f}",
            "medium": f"{low_threshold:.1f} <= score < {high_threshold:.1f}",
            "high": f"score >= {high_threshold:.1f}",
            "target_high_area_percent": 5,
            "target_low_area_percent": 35,
        },
        "files": {
            "fire": "fire_vulnerability_overlay.png",
            "fuel": "fuel_type_overlay.png",
            "slope": "slope_overlay.png",
        },
    }


def main():
    PROCESSED.mkdir(parents=True, exist_ok=True)
    with rasterio.open(SLOPE_TIF) as slope_ds, rasterio.open(FUEL_TIF) as fuel_ds:
        slope_bounds = transform_bounds(slope_ds.crs, APP_CRS, *slope_ds.bounds, densify_pts=21)
        analysis_area = box(*slope_bounds)

        burn_geometries, burn_features = load_burn_layer(analysis_area)
        heritage_features, heritage_skipped = load_heritage_layer(
            analysis_area, slope_ds, fuel_ds, burn_geometries
        )
        granite_features, granite_geometries = load_granite_layer(analysis_area)
        fuel_features, slope_features, fire_features = build_grid_layers(
            analysis_area, slope_ds, fuel_ds, granite_geometries
        )
        overlay_metadata = build_raster_overlays(analysis_area, slope_ds, fuel_ds, granite_geometries)

    write_geojson("heritage_all_layer.geojson", feature_collection("FRK all heritage", heritage_features))
    write_geojson("burn_options_layer.geojson", feature_collection("FRK burn options", burn_features))
    write_geojson("granite_layer.geojson", feature_collection("FRK granite influence", granite_features))
    write_geojson("fuel_type_layer.geojson", feature_collection("FRK fuel type grid", fuel_features))
    write_geojson("slope_layer.geojson", feature_collection("FRK slope grid", slope_features))
    write_geojson("fire_vulnerability_layer.geojson", feature_collection("FRK fire vulnerability grid", fire_features))

    # Keep the original names available for older app versions.
    write_geojson("heritage_sites_scored.geojson", feature_collection("FRK all heritage", heritage_features))
    write_geojson("burn_options_simplified.geojson", feature_collection("FRK burn options", burn_features))

    metadata = {
        "analysis_bounds_epsg_7844": list(analysis_area.bounds),
        "score_formula": {
            "heritage_vulnerability": {
                "fuel_risk": 0.45,
                "slope_risk": 0.25,
                "heritage_type_material_risk": 0.25,
                "burn_management_context": 0.05,
            },
            "area_vulnerability": {
                "fuel_risk": 0.55,
                "slope_risk": 0.35,
                "granite_influence": 0.10,
            },
        },
        "source_files": {
            "aboriginal_register_geojson": str(REGISTER_GEOJSON),
            "aboriginal_lodged_geojson": str(LODGED_GEOJSON),
            "state_heritage_geojson": str(STATE_HERITAGE_GEOJSON),
            "burn_geojson": str(BURN_GEOJSON),
            "geology_shp": str(GEOLOGY_SHP),
            "slope_tif": str(SLOPE_TIF),
            "fuel_tif": str(FUEL_TIF),
        },
        "counts": {
            "heritage_features": len(heritage_features),
            "heritage_kind": dict(Counter(f["properties"]["heritage_kind"] for f in heritage_features)),
            "heritage_levels": dict(Counter(f["properties"]["vulnerability_level"] for f in heritage_features)),
            "burn_features": len(burn_features),
            "granite_features": len(granite_features),
            "fuel_grid_cells": len(fuel_features),
            "slope_grid_cells": len(slope_features),
            "fire_grid_cells": len(fire_features),
            "fire_grid_levels": dict(Counter(f["properties"]["vulnerability_level"] for f in fire_features)),
            "skipped_heritage": dict(heritage_skipped),
        },
        "raster_overlays": overlay_metadata,
        "notes": [
            "Base map is separate from overlays; overlays can be shown together.",
            "Fuel class names come from NBIC ACS Stage 2 BFC Fuel Types Map attribute table release 2.",
            "Fire vulnerability grid is a prototype area layer using fuel, slope, and granite influence.",
            "Granite Influence is derived from granite-related interpreted bedrock geology polygons; it is geology context, not field-confirmed surface outcrop.",
            "Heritage vulnerability uses fuel, slope, heritage sensitivity, and burn option context.",
            "Burn options are management context, not live fire warning data.",
        ],
    }
    (PROCESSED / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Heritage features: {len(heritage_features)}")
    print(f"  {dict(Counter(f['properties']['heritage_kind'] for f in heritage_features))}")
    print(f"Burn option features: {len(burn_features)}")
    print(f"Granite features: {len(granite_features)}")
    print(f"Fuel cells: {len(fuel_features)}")
    print(f"Slope cells: {len(slope_features)}")
    print(f"Fire vulnerability cells: {len(fire_features)}")
    print(f"Skipped heritage: {dict(heritage_skipped)}")


if __name__ == "__main__":
    main()
