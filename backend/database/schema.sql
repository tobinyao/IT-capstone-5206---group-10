PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT,
    CHECK (role IN ('admin', 'user', 'viewer'))
);

CREATE TABLE IF NOT EXISTS heritage_sites (
    id TEXT PRIMARY KEY,
    identifier TEXT UNIQUE,
    name TEXT NOT NULL,
    source TEXT,
    geometry_json TEXT NOT NULL,
    properties_json TEXT,
    latitude REAL,
    longitude REAL,
    heritage_type TEXT,
    fuel_class TEXT,
    slope_degrees REAL,
    vulnerability_score REAL,
    vulnerability_level TEXT,
    assessed_date TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (vulnerability_score IS NULL OR (vulnerability_score >= 0 AND vulnerability_score <= 100)),
    CHECK (vulnerability_level IS NULL OR vulnerability_level IN ('Low', 'Medium', 'High'))
);

CREATE INDEX IF NOT EXISTS idx_heritage_sites_identifier
    ON heritage_sites(identifier);

CREATE INDEX IF NOT EXISTS idx_heritage_sites_source
    ON heritage_sites(source);

CREATE INDEX IF NOT EXISTS idx_heritage_sites_lat_lon
    ON heritage_sites(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_heritage_sites_vulnerability_level
    ON heritage_sites(vulnerability_level);

CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    heritage_id TEXT,
    assessed_by INTEGER,
    slope REAL,
    fuel_type TEXT,
    fuel_risk REAL,
    heritage_type TEXT,
    heritage_type_risk REAL,
    burn_context TEXT,
    burn_context_risk REAL,
    granite_influence REAL,
    total_score REAL NOT NULL,
    vulnerability_level TEXT NOT NULL,
    notes TEXT,
    assessed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (heritage_id) REFERENCES heritage_sites(id) ON DELETE SET NULL,
    FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (fuel_risk IS NULL OR (fuel_risk >= 0 AND fuel_risk <= 100)),
    CHECK (heritage_type_risk IS NULL OR (heritage_type_risk >= 0 AND heritage_type_risk <= 100)),
    CHECK (burn_context_risk IS NULL OR (burn_context_risk >= 0 AND burn_context_risk <= 100)),
    CHECK (granite_influence IS NULL OR (granite_influence >= 0 AND granite_influence <= 100)),
    CHECK (total_score >= 0 AND total_score <= 100),
    CHECK (vulnerability_level IN ('Low', 'Medium', 'High'))
);

CREATE INDEX IF NOT EXISTS idx_assessments_heritage_id
    ON assessments(heritage_id);

CREATE INDEX IF NOT EXISTS idx_assessments_assessed_at
    ON assessments(assessed_at);

CREATE TABLE IF NOT EXISTS burn_options (
    id TEXT PRIMARY KEY,
    burnid TEXT UNIQUE,
    geometry_json TEXT NOT NULL,
    properties_json TEXT,
    location TEXT,
    fin_yr TEXT,
    status TEXT,
    priority TEXT,
    purpose TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_burn_options_burnid
    ON burn_options(burnid);

CREATE INDEX IF NOT EXISTS idx_burn_options_status
    ON burn_options(status);

CREATE INDEX IF NOT EXISTS idx_burn_options_priority
    ON burn_options(priority);

CREATE TABLE IF NOT EXISTS granite_polygons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    geometry_json TEXT NOT NULL,
    properties_json TEXT,
    unit_name TEXT,
    code TEXT,
    rock_type TEXT,
    lithology TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_granite_polygons_code
    ON granite_polygons(code);

CREATE INDEX IF NOT EXISTS idx_granite_polygons_rock_type
    ON granite_polygons(rock_type);

CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    source_path TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geojson_features (
    layer_name TEXT NOT NULL,
    feature_index INTEGER NOT NULL,
    feature_id TEXT,
    geometry_json TEXT NOT NULL,
    properties_json TEXT NOT NULL,
    source_path TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (layer_name, feature_index)
);

CREATE INDEX IF NOT EXISTS idx_geojson_features_layer_name
    ON geojson_features(layer_name);

CREATE INDEX IF NOT EXISTS idx_geojson_features_feature_id
    ON geojson_features(feature_id);

CREATE TRIGGER IF NOT EXISTS trg_app_metadata_updated_at
AFTER UPDATE ON app_metadata
FOR EACH ROW
BEGIN
    UPDATE app_metadata
    SET updated_at = CURRENT_TIMESTAMP
    WHERE key = OLD.key;
END;

CREATE TRIGGER IF NOT EXISTS trg_geojson_features_updated_at
AFTER UPDATE ON geojson_features
FOR EACH ROW
BEGIN
    UPDATE geojson_features
    SET updated_at = CURRENT_TIMESTAMP
    WHERE layer_name = OLD.layer_name
      AND feature_index = OLD.feature_index;
END;

CREATE TRIGGER IF NOT EXISTS trg_heritage_sites_updated_at
AFTER UPDATE ON heritage_sites
FOR EACH ROW
BEGIN
    UPDATE heritage_sites
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_burn_options_updated_at
AFTER UPDATE ON burn_options
FOR EACH ROW
BEGIN
    UPDATE burn_options
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_granite_polygons_updated_at
AFTER UPDATE ON granite_polygons
FOR EACH ROW
BEGIN
    UPDATE granite_polygons
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

INSERT OR IGNORE INTO schema_migrations (version)
VALUES ('001_initial_sqlite_schema');
