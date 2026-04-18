const state = {
  map: null,
  metadata: null,
  data: {},
  layers: {},
  filters: {
    heritageKind: "all",
    heritageRisk: "all",
  },
};

const colors = {
  High: "#d2302a",
  Medium: "#ebae26",
  Low: "#14964b",
};

const layerFiles = {
  heritage: "../data/processed/heritage_all_layer.geojson",
  burn: "../data/processed/burn_options_layer.geojson",
  granite: "../data/processed/granite_layer.geojson",
  metadata: "../data/processed/metadata.json",
};

function riskColor(level) {
  return colors[level] || "#667078";
}

function renderMetric(label, value) {
  return `
    <div class="metric">
      <dt>${label}</dt>
      <dd>${value ?? "Unknown"}</dd>
    </div>
  `;
}

function setDetails(title, intro, metrics) {
  document.querySelector("#detailTitle").textContent = title;
  document.querySelector("#detailIntro").textContent = intro;
  document.querySelector("#detailList").innerHTML = metrics.map(([label, value]) => renderMetric(label, value)).join("");
}

function showFeatureDetails(props) {
  if (props.layer === "Heritage") {
    setDetails(
      props.name || props.identifier || "Heritage place",
      `${props.heritage_kind} heritage · ${props.vulnerability_level} vulnerability, score ${props.vulnerability_score}/100.`,
      [
        ["Identifier", props.identifier],
        ["Name", props.name],
        ["Heritage type", props.heritage_kind],
        ["Status", props.place_status],
        ["Place type", props.place_type],
        ["Region / LGA", props.region],
        ["Sensitive", props.culturally_sensitive],
        ["Fuel", props.fuel_class],
        ["Slope", props.slope_degrees === null ? "Unknown" : `${props.slope_degrees} deg`],
        ["Slope data", props.slope_data_quality],
        ["Heritage material/type", props.heritage_type_risk_label],
        ["Material/type risk", props.heritage_type_risk],
        ["Burn context", props.burn_management_context],
      ]
    );
    return;
  }

  if (props.layer === "Granite influence") {
    setDetails(props.unit_name || "Granite influence", props.description || "Granite / granitoid geology context.", [
      ["Code", props.code],
      ["Rock type", props.rock_type],
      ["Lithology", props.lithology],
      ["Influence value", "100 inside granite-related polygon"],
    ]);
    return;
  }

  if (props.layer === "Burn option") {
    setDetails(props.location || "Burn option area", props.status || "Burn option management context.", [
      ["Burn ID", props.burnid],
      ["Financial year", props.fin_yr],
      ["Priority", props.priority],
      ["Purpose", props.purpose],
    ]);
  }
}

function bindFeature(feature, layer) {
  const props = feature.properties;
  layer.on("click", () => showFeatureDetails(props));
  const title = props.name || props.unit_name || props.location || props.layer;
  layer.bindPopup(`<strong>${title}</strong><br>${props.layer}`);
}

function syncDefaultLayerToggles() {
  const defaults = {
    fire: true,
    heritage: true,
    burn: false,
    granite: false,
    fuel: false,
    slope: false,
  };
  document.querySelectorAll(".layer-toggle").forEach((toggle) => {
    toggle.checked = Boolean(defaults[toggle.dataset.layer]);
  });
}

function isLayerEnabled(name) {
  return Boolean(document.querySelector(`.layer-toggle[data-layer="${name}"]`)?.checked);
}

function heritagePassesFilters(feature) {
  const props = feature.properties;
  const kindOk = state.filters.heritageKind === "all" || props.heritage_kind === state.filters.heritageKind;
  const riskOk = state.filters.heritageRisk === "all" || props.vulnerability_level === state.filters.heritageRisk;
  return kindOk && riskOk;
}

function updateSummary() {
  const counts = { High: 0, Medium: 0, Low: 0 };
  const features = state.data.heritage?.features || [];
  features.filter(heritagePassesFilters).forEach((feature) => {
    counts[feature.properties.vulnerability_level] += 1;
  });
  document.querySelector("#highCount").textContent = counts.High;
  document.querySelector("#mediumCount").textContent = counts.Medium;
  document.querySelector("#lowCount").textContent = counts.Low;
}

function rebuildHeritageLayer() {
  if (state.layers.heritage) {
    state.map.removeLayer(state.layers.heritage);
  }

  const filtered = (state.data.heritage?.features || []).filter(heritagePassesFilters);
  const polygons = L.geoJSON(
    { type: "FeatureCollection", features: filtered },
    {
      style(feature) {
        return {
          color: riskColor(feature.properties.vulnerability_level),
          weight: 2.4,
          opacity: 1,
          fillColor: riskColor(feature.properties.vulnerability_level),
          fillOpacity: 0.22,
          pane: "heritagePane",
        };
      },
      onEachFeature: bindFeature,
      pane: "heritagePane",
    }
  );

  const markers = L.layerGroup(
    filtered.map((feature) => {
      const props = feature.properties;
      const marker = L.circleMarker([props.latitude, props.longitude], {
        pane: "heritageMarkerPane",
        radius: props.vulnerability_level === "High" ? 9 : 7,
        color: "#ffffff",
        weight: 2,
        fillColor: riskColor(props.vulnerability_level),
        fillOpacity: 0.98,
      });
      marker.on("click", () => showFeatureDetails(props));
      marker.bindPopup(`<strong>${props.name}</strong><br>${props.heritage_kind} heritage`);
      return marker;
    })
  );

  state.layers.heritage = L.layerGroup([polygons, markers]);
  updateSummary();
  if (isLayerEnabled("heritage")) {
    state.layers.heritage.addTo(state.map);
  }
}

function imageBounds() {
  const [west, south, east, north] = state.metadata.raster_overlays.bounds_epsg_7844;
  return [
    [south, west],
    [north, east],
  ];
}

function buildRasterOverlay(fileName, opacity) {
  return L.imageOverlay(`../data/processed/${fileName}`, imageBounds(), {
    opacity,
    interactive: false,
    pane: "rasterPane",
  });
}

function buildLayers() {
  const overlays = state.metadata.raster_overlays.files;
  state.layers.fire = buildRasterOverlay(overlays.fire, 0.92);
  state.layers.fuel = buildRasterOverlay(overlays.fuel, 0.62);
  state.layers.slope = buildRasterOverlay(overlays.slope, 0.62);

  state.layers.burn = L.geoJSON(state.data.burn, {
    style: {
      color: "#167d94",
      weight: 3,
      opacity: 1,
      fillColor: "#47a6b6",
      fillOpacity: 0.16,
      dashArray: "9 5",
      pane: "contextPane",
    },
    onEachFeature: bindFeature,
    pane: "contextPane",
  });

  state.layers.granite = L.geoJSON(state.data.granite, {
    style: {
      color: "#2f3033",
      weight: 2.2,
      opacity: 0.95,
      fillColor: "#6e684b",
      fillOpacity: 0.44,
      pane: "contextPane",
    },
    onEachFeature: bindFeature,
    pane: "contextPane",
  });

  rebuildHeritageLayer();
}

function refreshLayerVisibility() {
  ["fire", "granite", "fuel", "slope", "burn", "heritage"].forEach((name) => {
    const layer = state.layers[name];
    if (!layer) return;
    if (isLayerEnabled(name)) {
      layer.addTo(state.map);
    } else {
      state.map.removeLayer(layer);
    }
  });
  bringTopLayersForward();
}

function bringTopLayersForward() {
  ["fire", "granite", "fuel", "slope", "burn", "heritage"].forEach((name) => {
    const layer = state.layers[name];
    if (layer?.bringToFront && isLayerEnabled(name)) {
      layer.bringToFront();
    }
  });
}

function renderStudyArea() {
  const [west, south, east, north] = state.metadata.analysis_bounds_epsg_7844;
  const bounds = [
    [south, west],
    [north, east],
  ];
  L.rectangle(bounds, {
    color: "#202124",
    weight: 2,
    fillOpacity: 0,
    dashArray: "8 6",
    pane: "contextPane",
  }).addTo(state.map);
  L.marker([north - 0.03, west + 0.04], {
    interactive: false,
    icon: L.divIcon({
      className: "",
      html: '<div class="study-label">FRK study area</div>',
    }),
  }).addTo(state.map);

  state.map.fitBounds(bounds, { padding: [26, 26] });
}

function createMapPanes() {
  state.map.createPane("rasterPane");
  state.map.getPane("rasterPane").style.zIndex = 350;
  state.map.getPane("rasterPane").style.pointerEvents = "none";

  state.map.createPane("contextPane");
  state.map.getPane("contextPane").style.zIndex = 430;

  state.map.createPane("heritagePane");
  state.map.getPane("heritagePane").style.zIndex = 520;

  state.map.createPane("heritageMarkerPane");
  state.map.getPane("heritageMarkerPane").style.zIndex = 650;
}

function updateClassificationText() {
  const classification = state.metadata.raster_overlays?.classification;
  if (!classification) return;
  document.querySelector("#lowRule").textContent = classification.low;
  document.querySelector("#mediumRule").textContent = classification.medium;
  document.querySelector("#highRule").textContent = classification.high;
}

function setFilter(group, value, button) {
  state.filters[group] = value;
  document.querySelectorAll(`.filter-set[data-filter="${group}"] .filter-button`).forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  rebuildHeritageLayer();
  refreshLayerVisibility();
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.json();
}

async function init() {
  state.map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    minZoom: 8,
    maxZoom: 19,
  }).setView([-34.7, 117.45], 9);

  createMapPanes();

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    crossOrigin: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(state.map);

  const [heritage, burn, granite, metadata] = await Promise.all([
    loadJson(layerFiles.heritage),
    loadJson(layerFiles.burn),
    loadJson(layerFiles.granite),
    loadJson(layerFiles.metadata),
  ]);

  state.data = { heritage, burn, granite };
  state.metadata = metadata;
  syncDefaultLayerToggles();
  updateClassificationText();
  buildLayers();
  refreshLayerVisibility();
  renderStudyArea();
  setTimeout(() => state.map.invalidateSize(), 100);
}

document.querySelectorAll(".layer-toggle").forEach((toggle) => {
  toggle.addEventListener("change", refreshLayerVisibility);
});

document.querySelectorAll(".filter-set").forEach((set) => {
  const group = set.dataset.filter;
  set.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => setFilter(group, button.dataset.value, button));
  });
});

init().catch((error) => {
  document.querySelector("#detailTitle").textContent = "Data not ready";
  document.querySelector("#detailIntro").textContent = error.message;
  console.error(error);
});
