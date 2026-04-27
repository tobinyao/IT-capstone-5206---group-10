import { useEffect, useMemo, useRef, useState } from 'react'
import './RiskMap.css'

type RiskLevel = 'High' | 'Medium' | 'Low'
type HeritageKindFilter = 'all' | 'Aboriginal' | 'Non-Aboriginal'
type HeritageRiskFilter = 'all' | RiskLevel
type LayerName = 'fire' | 'heritage' | 'burn' | 'granite' | 'fuel' | 'slope'

type Metric = {
  label: string
  value: string
}

type DetailState = {
  title: string
  intro: string
  metrics: Metric[]
}

type ToggleState = Record<LayerName, boolean>

type FeatureCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

type GeoFeature = {
  type: string
  geometry: {
    type: string
    coordinates: unknown
  } | null
  properties: Record<string, unknown>
}

type Metadata = {
  analysis_bounds_epsg_7844: [number, number, number, number]
  counts: {
    heritage_levels: Record<RiskLevel, number>
  }
  raster_overlays: {
    bounds_epsg_7844: [number, number, number, number]
    classification: {
      low: string
      medium: string
      high: string
    }
    files: {
      fire: string
      fuel: string
      slope: string
    }
  }
}

type HeritageProperties = {
  layer: 'Heritage'
  identifier?: string
  name?: string
  heritage_kind?: 'Aboriginal' | 'Non-Aboriginal'
  place_status?: string
  place_type?: string
  region?: string
  culturally_sensitive?: string
  fuel_class?: string
  slope_degrees?: number | null
  slope_data_quality?: string
  heritage_type_risk_label?: string
  heritage_type_risk?: number
  burn_management_context?: string
  vulnerability_score?: number
  vulnerability_level?: RiskLevel
  latitude?: number
  longitude?: number
}

type GraniteProperties = {
  layer: 'Granite influence'
  unit_name?: string
  code?: string
  description?: string
  rock_type?: string
  lithology?: string
}

type BurnProperties = {
  layer: 'Burn option'
  burnid?: string
  location?: string
  status?: string
  priority?: number
  fin_yr?: string
  purpose?: string
}

declare global {
  interface Window {
    L?: any
  }
}

const DATA_BASE = `${import.meta.env.BASE_URL}data/processed/`
const IS_TEST_ENV = import.meta.env.MODE === 'test'

const defaultLayerVisibility: ToggleState = {
  fire: true,
  heritage: true,
  burn: false,
  granite: false,
  fuel: false,
  slope: false,
}

const defaultDetails: DetailState = {
  title: 'Select a heritage place',
  intro:
    'Drag to pan, scroll to zoom, and click a heritage place, burn option, or geology area to inspect source attributes.',
  metrics: [],
}

const levelColors: Record<RiskLevel, string> = {
  High: '#d2302a',
  Medium: '#ebae26',
  Low: '#14964b',
}

function riskColor(level?: string) {
  return levelColors[level as RiskLevel] ?? '#667078'
}

function formatValue(value: unknown, fallback = 'Unknown') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function loadExternalStylesheet(id: string, href: string) {
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function loadExternalScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.L) {
      resolve()
      return
    }

    const existingScript = document.getElementById(id) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Could not load Leaflet.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Leaflet.'))
    document.body.appendChild(script)
  })
}

function getImageBounds(metadata: Metadata) {
  const [west, south, east, north] = metadata.raster_overlays.bounds_epsg_7844
  return [
    [south, west],
    [north, east],
  ]
}

function getAnalysisBounds(metadata: Metadata) {
  const [west, south, east, north] = metadata.analysis_bounds_epsg_7844
  return [
    [south, west],
    [north, east],
  ]
}

function getHeritageMarkerPosition(feature: GeoFeature, properties: HeritageProperties) {
  if (typeof properties.latitude === 'number' && typeof properties.longitude === 'number') {
    return [properties.latitude, properties.longitude] as [number, number]
  }

  if (feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
    const [longitude, latitude] = feature.geometry.coordinates as [number, number]
    return [latitude, longitude] as [number, number]
  }

  return null
}

function RiskMap() {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const studyAreaLayerRef = useRef<any>(null)
  const studyAreaLabelRef = useRef<any>(null)
  const layerRefs = useRef<Partial<Record<LayerName, any>>>({})

  const [leafletReady, setLeafletReady] = useState(Boolean(window.L) || IS_TEST_ENV)
  const [mapError, setMapError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [heritageData, setHeritageData] = useState<FeatureCollection | null>(null)
  const [burnData, setBurnData] = useState<FeatureCollection | null>(null)
  const [graniteData, setGraniteData] = useState<FeatureCollection | null>(null)
  const [summary, setSummary] = useState<Record<RiskLevel, number>>({
    High: 0,
    Medium: 0,
    Low: 0,
  })
  const [details, setDetails] = useState<DetailState>(defaultDetails)
  const [visibleLayers, setVisibleLayers] = useState<ToggleState>(defaultLayerVisibility)
  const [heritageRiskFilter, setHeritageRiskFilter] = useState<HeritageRiskFilter>('all')
  const [heritageKindFilter, setHeritageKindFilter] = useState<HeritageKindFilter>('all')

  const classification = metadata?.raster_overlays.classification

  const summaryCards = useMemo(
    () => [
      { label: 'High', value: summary.High },
      { label: 'Medium', value: summary.Medium },
      { label: 'Low', value: summary.Low },
    ],
    [summary]
  )

  useEffect(() => {
    if (IS_TEST_ENV) return

    let active = true
    loadExternalStylesheet('leaflet-cdn-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')

    loadExternalScript('leaflet-cdn-js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      .then(() => {
        if (active) setLeafletReady(true)
      })
      .catch((error) => {
        if (active) setMapError(error.message)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (IS_TEST_ENV) return

    let active = true

    async function loadData() {
      try {
        const [metadataResponse, heritageResponse, burnResponse, graniteResponse] = await Promise.all([
          fetch(`${DATA_BASE}metadata.json`),
          fetch(`${DATA_BASE}heritage_all_layer.geojson`),
          fetch(`${DATA_BASE}burn_options_layer.geojson`),
          fetch(`${DATA_BASE}granite_layer.geojson`),
        ])

        if (!metadataResponse.ok || !heritageResponse.ok || !burnResponse.ok || !graniteResponse.ok) {
          throw new Error('Could not load processed Risk Map data.')
        }

        const [metadataJson, heritageJson, burnJson, graniteJson] = await Promise.all([
          metadataResponse.json(),
          heritageResponse.json(),
          burnResponse.json(),
          graniteResponse.json(),
        ])

        if (!active) return

        setMetadata(metadataJson)
        setHeritageData(heritageJson)
        setBurnData(burnJson)
        setGraniteData(graniteJson)
      } catch (error) {
        if (active) {
          setMapError(error instanceof Error ? error.message : 'Could not load processed Risk Map data.')
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapElementRef.current || mapRef.current || !window.L || IS_TEST_ENV) return

    const L = window.L
    const map = L.map(mapElementRef.current, {
      preferCanvas: true,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      minZoom: 8,
      maxZoom: 19,
    }).setView([-34.7, 117.45], 9)

    map.createPane('rasterPane')
    map.getPane('rasterPane').style.zIndex = '350'
    map.getPane('rasterPane').style.pointerEvents = 'none'

    map.createPane('contextPane')
    map.getPane('contextPane').style.zIndex = '430'

    map.createPane('heritagePane')
    map.getPane('heritagePane').style.zIndex = '520'

    map.createPane('heritageMarkerPane')
    map.getPane('heritageMarkerPane').style.zIndex = '650'

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [leafletReady])

  useEffect(() => {
    if (
      IS_TEST_ENV ||
      !leafletReady ||
      !window.L ||
      !mapRef.current ||
      !metadata ||
      !heritageData ||
      !burnData ||
      !graniteData
    ) {
      return
    }

    const L = window.L
    const map = mapRef.current

    Object.values(layerRefs.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    })

    if (studyAreaLayerRef.current && map.hasLayer(studyAreaLayerRef.current)) {
      map.removeLayer(studyAreaLayerRef.current)
    }

    if (studyAreaLabelRef.current && map.hasLayer(studyAreaLabelRef.current)) {
      map.removeLayer(studyAreaLabelRef.current)
    }

    const filteredHeritage = heritageData.features.filter((feature) => {
      const properties = feature.properties as HeritageProperties
      const kindOk = heritageKindFilter === 'all' || properties.heritage_kind === heritageKindFilter
      const riskOk = heritageRiskFilter === 'all' || properties.vulnerability_level === heritageRiskFilter
      return kindOk && riskOk
    })

    const counts = filteredHeritage.reduce(
      (acc, feature) => {
        const level = (feature.properties as HeritageProperties).vulnerability_level
        if (level) acc[level] += 1
        return acc
      },
      { High: 0, Medium: 0, Low: 0 } as Record<RiskLevel, number>
    )
    setSummary(counts)

    const imageBounds = getImageBounds(metadata)
    const fireOverlay = L.imageOverlay(`${DATA_BASE}${metadata.raster_overlays.files.fire}`, imageBounds, {
      opacity: 0.92,
      interactive: false,
      pane: 'rasterPane',
    })
    const fuelOverlay = L.imageOverlay(`${DATA_BASE}${metadata.raster_overlays.files.fuel}`, imageBounds, {
      opacity: 0.62,
      interactive: false,
      pane: 'rasterPane',
    })
    const slopeOverlay = L.imageOverlay(`${DATA_BASE}${metadata.raster_overlays.files.slope}`, imageBounds, {
      opacity: 0.62,
      interactive: false,
      pane: 'rasterPane',
    })

    const setHeritageDetails = (properties: HeritageProperties) => {
      setDetails({
        title: properties.name || properties.identifier || 'Heritage place',
        intro: `${formatValue(properties.heritage_kind)} heritage · ${formatValue(
          properties.vulnerability_level
        )} vulnerability, score ${formatValue(properties.vulnerability_score, 'Unknown')}/100.`,
        metrics: [
          { label: 'Identifier', value: formatValue(properties.identifier) },
          { label: 'Name', value: formatValue(properties.name) },
          { label: 'Heritage type', value: formatValue(properties.heritage_kind) },
          { label: 'Status', value: formatValue(properties.place_status) },
          { label: 'Place type', value: formatValue(properties.place_type) },
          { label: 'Region / LGA', value: formatValue(properties.region) },
          { label: 'Sensitive', value: formatValue(properties.culturally_sensitive) },
          { label: 'Fuel', value: formatValue(properties.fuel_class) },
          {
            label: 'Slope',
            value:
              typeof properties.slope_degrees === 'number'
                ? `${properties.slope_degrees.toFixed(2)} deg`
                : 'Unknown',
          },
          { label: 'Slope data', value: formatValue(properties.slope_data_quality) },
          { label: 'Heritage material/type', value: formatValue(properties.heritage_type_risk_label) },
          { label: 'Material/type risk', value: formatValue(properties.heritage_type_risk) },
          { label: 'Burn context', value: formatValue(properties.burn_management_context) },
        ],
      })
    }

    const setGraniteDetails = (properties: GraniteProperties) => {
      setDetails({
        title: properties.unit_name || 'Granite influence',
        intro: properties.description || 'Granite / granitoid geology context.',
        metrics: [
          { label: 'Code', value: formatValue(properties.code) },
          { label: 'Rock type', value: formatValue(properties.rock_type) },
          { label: 'Lithology', value: formatValue(properties.lithology) },
          { label: 'Influence value', value: '100 inside granite-related polygon' },
        ],
      })
    }

    const setBurnDetails = (properties: BurnProperties) => {
      setDetails({
        title: properties.location || 'Burn option area',
        intro: properties.status || 'Burn option management context.',
        metrics: [
          { label: 'Burn ID', value: formatValue(properties.burnid) },
          { label: 'Financial year', value: formatValue(properties.fin_yr) },
          { label: 'Priority', value: formatValue(properties.priority) },
          { label: 'Purpose', value: formatValue(properties.purpose) },
        ],
      })
    }

    const heritagePolygons = L.geoJSON(
      { type: 'FeatureCollection', features: filteredHeritage },
      {
        style: (feature: GeoFeature) => {
          const properties = feature.properties as HeritageProperties
          return {
            color: riskColor(properties.vulnerability_level),
            weight: 2.4,
            opacity: 1,
            fillColor: riskColor(properties.vulnerability_level),
            fillOpacity: 0.22,
            pane: 'heritagePane',
          }
        },
        onEachFeature: (feature: GeoFeature, layer: any) => {
          const properties = feature.properties as HeritageProperties
          layer.on('click', () => setHeritageDetails(properties))
          layer.bindPopup(
            `<strong>${formatValue(properties.name, 'Heritage place')}</strong><br>${formatValue(
              properties.heritage_kind,
              'Heritage'
            )} heritage`
          )
        },
        pane: 'heritagePane',
      }
    )

    const heritageMarkers = L.layerGroup(
      filteredHeritage
        .map((feature) => {
          const properties = feature.properties as HeritageProperties
          const position = getHeritageMarkerPosition(feature, properties)
          if (!position) return null

          const marker = L.circleMarker(position, {
            pane: 'heritageMarkerPane',
            radius: properties.vulnerability_level === 'High' ? 9 : 7,
            color: '#ffffff',
            weight: 2,
            fillColor: riskColor(properties.vulnerability_level),
            fillOpacity: 0.98,
          })

          marker.on('click', () => setHeritageDetails(properties))
          marker.bindPopup(
            `<strong>${formatValue(properties.name, 'Heritage place')}</strong><br>${formatValue(
              properties.heritage_kind,
              'Heritage'
            )} heritage`
          )
          return marker
        })
        .filter(Boolean)
    )

    const burnLayer = L.geoJSON(burnData, {
      style: {
        color: '#167d94',
        weight: 3,
        opacity: 1,
        fillColor: '#47a6b6',
        fillOpacity: 0.16,
        dashArray: '9 5',
        pane: 'contextPane',
      },
      onEachFeature: (feature: GeoFeature, layer: any) => {
        const properties = feature.properties as BurnProperties
        layer.on('click', () => setBurnDetails(properties))
        layer.bindPopup(`<strong>${formatValue(properties.location, 'Burn option area')}</strong><br>Burn option`)
      },
      pane: 'contextPane',
    })

    const graniteLayer = L.geoJSON(graniteData, {
      style: {
        color: '#2f3033',
        weight: 2.2,
        opacity: 0.95,
        fillColor: '#6e684b',
        fillOpacity: 0.44,
        pane: 'contextPane',
      },
      onEachFeature: (feature: GeoFeature, layer: any) => {
        const properties = feature.properties as GraniteProperties
        layer.on('click', () => setGraniteDetails(properties))
        layer.bindPopup(`<strong>${formatValue(properties.unit_name, 'Granite influence')}</strong><br>Granite influence`)
      },
      pane: 'contextPane',
    })

    const heritageLayer = L.layerGroup([heritagePolygons, heritageMarkers])

    layerRefs.current = {
      fire: fireOverlay,
      fuel: fuelOverlay,
      slope: slopeOverlay,
      burn: burnLayer,
      granite: graniteLayer,
      heritage: heritageLayer,
    }

    ;(Object.entries(defaultLayerVisibility) as Array<[LayerName, boolean]>).forEach(([layerName]) => {
      const layer = layerRefs.current[layerName]
      if (!layer) return
      if (visibleLayers[layerName]) {
        layer.addTo(map)
      }
    })

    const analysisBounds = getAnalysisBounds(metadata)
    studyAreaLayerRef.current = L.rectangle(analysisBounds, {
      color: '#202124',
      weight: 2,
      fillOpacity: 0,
      dashArray: '8 6',
      pane: 'contextPane',
    }).addTo(map)

    const [, west] = analysisBounds[0]
    const [north] = analysisBounds[1]
    studyAreaLabelRef.current = L.marker([north - 0.03, west + 0.04], {
      interactive: false,
      icon: L.divIcon({
        className: 'firewatch-study-label',
        html: '<div class="firewatch-study-label__bubble">FRK study area</div>',
      }),
    }).addTo(map)

    map.fitBounds(analysisBounds, { padding: [26, 26] })
    setTimeout(() => map.invalidateSize(), 100)
  }, [leafletReady, metadata, heritageData, burnData, graniteData, visibleLayers, heritageRiskFilter, heritageKindFilter])

  return (
    <div className="firewatch-risk-page">
      <aside className="firewatch-risk-page__panel">
        <div className="firewatch-brand">
          <p className="firewatch-brand__eyebrow">FRK heritage fire vulnerability</p>
          <h1 className="firewatch-brand__title">FireWatch Heritage map</h1>
          <p className="firewatch-brand__lede">
            Prioritise heritage places by fuel exposure, slope, cultural sensitivity, and burn management context.
          </p>
        </div>

        <section className="firewatch-summary" aria-label="Risk summary">
          {summaryCards.map((card) => (
            <div key={card.label} className="firewatch-summary__card">
              <span>{card.value}</span>
              <small>{card.label}</small>
            </div>
          ))}
        </section>

        <section className="firewatch-card" aria-label="Map layers">
          <h2>Map Layers</h2>
          {(
            [
              ['fire', 'Fire vulnerability'],
              ['heritage', 'Heritage places'],
              ['burn', 'Burn options'],
              ['granite', 'Granite influence'],
              ['fuel', 'Fuel type'],
              ['slope', 'Slope'],
            ] as Array<[LayerName, string]>
          ).map(([layerName, label]) => (
            <label key={layerName} className="firewatch-toggle-row">
              <input
                type="checkbox"
                checked={visibleLayers[layerName]}
                onChange={(event) =>
                  setVisibleLayers((current) => ({
                    ...current,
                    [layerName]: event.target.checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
        </section>

        <section className="firewatch-card" aria-label="Layer colour key">
          <h2>Layer Key</h2>

          <div className="firewatch-key-group">
            <h3>Fire Vulnerability</h3>
            <div>
              <span className="firewatch-key-box firewatch-key-box--high" />
              <span>
                High: <strong>{classification?.high ?? 'top risk areas'}</strong>
              </span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--medium" />
              <span>
                Medium: <strong>{classification?.medium ?? 'middle risk areas'}</strong>
              </span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--low" />
              <span>
                Low: <strong>{classification?.low ?? 'lower risk areas'}</strong>
              </span>
            </div>
          </div>

          <div className="firewatch-key-group">
            <h3>Fuel Type</h3>
            <div>
              <span className="firewatch-key-box firewatch-key-box--forest" />
              <span>Forest / woodland</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--shrub" />
              <span>Shrubland</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--grass" />
              <span>Grassland / cropland</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--wet" />
              <span>Wetland / water</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--urban" />
              <span>Built-up / bare ground</span>
            </div>
          </div>

          <div className="firewatch-key-group">
            <h3>Slope</h3>
            <div>
              <span className="firewatch-key-box firewatch-key-box--slope-low" />
              <span>Low</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--slope-mid" />
              <span>Moderate</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--slope-high" />
              <span>Steep</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--slope-vhigh" />
              <span>Very steep</span>
            </div>
          </div>

          <div className="firewatch-key-group">
            <h3>Context Layers</h3>
            <div>
              <span className="firewatch-key-line firewatch-key-line--burn" />
              <span>Burn option boundary</span>
            </div>
            <div>
              <span className="firewatch-key-box firewatch-key-box--granite" />
              <span>Granite influence</span>
            </div>
            <div>
              <span className="firewatch-key-dot firewatch-key-dot--heritage" />
              <span>Heritage place</span>
            </div>
          </div>
        </section>

        <section className="firewatch-controls" aria-label="Heritage filters">
          <div className="firewatch-filter-set">
            <p>Heritage risk filter</p>
            <div className="firewatch-button-row">
              {(['all', 'High', 'Medium', 'Low'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`firewatch-filter-button ${heritageRiskFilter === value ? 'is-active' : ''}`}
                  onClick={() => setHeritageRiskFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="firewatch-filter-set">
            <p>Heritage type filter</p>
            <div className="firewatch-button-row">
              {(['all', 'Aboriginal', 'Non-Aboriginal'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`firewatch-filter-button ${heritageKindFilter === value ? 'is-active' : ''}`}
                  onClick={() => setHeritageKindFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="firewatch-card firewatch-details" aria-live="polite">
          <h2>{details.title}</h2>
          <p className="firewatch-details__intro">{details.intro}</p>
          <dl className="firewatch-metric-list">
            {details.metrics.map((metric) => (
              <div key={metric.label} className="firewatch-metric">
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="firewatch-card firewatch-method">
          <h2>Score Method</h2>
          <p>
            <strong>Heritage score =</strong> fuel 45% + slope 25% + heritage type/material 25% + burn context 5%.
          </p>
          <p>
            <strong>Area score =</strong> fuel 55% + slope 35% + granite influence 10%.
          </p>
          <p className="firewatch-method__note">
            Unknown slope no longer produces High heritage risk; it is capped pending review.
          </p>
        </section>
      </aside>

      <section className="firewatch-map-wrap" aria-label="Interactive map">
        <div ref={mapElementRef} id="firewatch-risk-map" />
        {!leafletReady && !IS_TEST_ENV && !mapError && <div className="firewatch-map-overlay">Loading map engine…</div>}
        {mapError && <div className="firewatch-map-overlay firewatch-map-overlay--error">{mapError}</div>}
      </section>
    </div>
  )
}

export default RiskMap
