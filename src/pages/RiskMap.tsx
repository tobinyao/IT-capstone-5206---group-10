import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type RiskLevel = 'High' | 'Medium' | 'Low'

type HeritageProperties = {
  layer: string
  name?: string
  identifier?: string
  heritage_kind?: string
  vulnerability_level?: RiskLevel
  vulnerability_score?: number
  latitude?: number
  longitude?: number
  place_status?: string
  place_type?: string
  region?: string
  fuel_class?: string
  slope_degrees?: number | null
}

type Metadata = {
  analysis_bounds_epsg_7844: [number, number, number, number]
  raster_overlays: {
    bounds_epsg_7844: [number, number, number, number]
    classification?: {
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
  counts?: {
    heritage_features?: number
    burn_features?: number
    granite_features?: number
  }
}

type LayerName = 'fire' | 'heritage' | 'burn' | 'granite' | 'fuel' | 'slope'

const DATA_PATH = '/data/processed/'

const layerFiles = {
  heritage: `${DATA_PATH}heritage_all_layer.geojson`,
  burn: `${DATA_PATH}burn_options_layer.geojson`,
  granite: `${DATA_PATH}granite_layer.geojson`,
  metadata: `${DATA_PATH}metadata.json`,
}

const riskColours: Record<RiskLevel, string> = {
  High: '#d2302a',
  Medium: '#ebae26',
  Low: '#14964b',
}

const mapInstructions = [
  'Use the layer checkboxes to turn map layers on or off.',
  'Scroll or use the map controls to zoom in and out.',
  'Click and drag the map to pan around the FRK study area.',
  'Click a heritage place to view its key attributes in the details panel.',
  'Use the heritage filters to narrow results by risk level and heritage type.',
]

const layerExplanations = [
  {
    title: 'Fire vulnerability colours',
    description:
      'Red indicates higher vulnerability, amber indicates medium vulnerability, and green indicates lower vulnerability. These colours help users quickly identify priority heritage areas.',
  },
  {
    title: 'Fuel type',
    description:
      'The fuel type layer shows processed vegetation or surface fuel categories used to support the fire vulnerability analysis.',
  },
  {
    title: 'Slope',
    description:
      'The slope layer shows terrain steepness. Steeper areas may influence fire behaviour, access difficulty and mitigation planning.',
  },
]

const RiskMap = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<Partial<Record<LayerName, L.Layer>>>({})
  const dataRef = useRef<{ heritage?: GeoJSON.FeatureCollection }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFeature, setSelectedFeature] = useState<HeritageProperties | null>(null)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerName, boolean>>({
    fire: true,
    heritage: true,
    burn: false,
    granite: false,
    fuel: false,
    slope: false,
  })
  const [heritageKind, setHeritageKind] = useState('all')
  const [heritageRisk, setHeritageRisk] = useState('all')
  const [summary, setSummary] = useState({ High: 0, Medium: 0, Low: 0 })

  const riskColour = (level?: string) => {
    return riskColours[level as RiskLevel] || '#667078'
  }

  const loadJson = async <T,>(path: string): Promise<T> => {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Could not load ${path}`)
    }
    return response.json()
  }

  const imageBounds = (meta: Metadata): L.LatLngBoundsExpression => {
    const [west, south, east, north] = meta.raster_overlays.bounds_epsg_7844
    return [
      [south, west],
      [north, east],
    ]
  }

  const analysisBounds = (meta: Metadata): L.LatLngBoundsExpression => {
    const [west, south, east, north] = meta.analysis_bounds_epsg_7844
    return [
      [south, west],
      [north, east],
    ]
  }

  const createMapPanes = (map: L.Map) => {
    map.createPane('rasterPane')
    const rasterPane = map.getPane('rasterPane')
    if (rasterPane) {
      rasterPane.style.zIndex = '350'
      rasterPane.style.pointerEvents = 'none'
    }

    map.createPane('contextPane')
    const contextPane = map.getPane('contextPane')
    if (contextPane) contextPane.style.zIndex = '430'

    map.createPane('heritagePane')
    const heritagePane = map.getPane('heritagePane')
    if (heritagePane) heritagePane.style.zIndex = '520'

    map.createPane('heritageMarkerPane')
    const markerPane = map.getPane('heritageMarkerPane')
    if (markerPane) markerPane.style.zIndex = '650'
  }

  const buildHeritageLayer = (
    heritageData: GeoJSON.FeatureCollection,
    kindFilter: string,
    riskFilter: string
  ) => {
    const filteredFeatures = heritageData.features.filter((feature) => {
      const props = feature.properties as HeritageProperties
      const kindOk = kindFilter === 'all' || props.heritage_kind === kindFilter
      const riskOk = riskFilter === 'all' || props.vulnerability_level === riskFilter
      return kindOk && riskOk
    })

    const counts = { High: 0, Medium: 0, Low: 0 }
    filteredFeatures.forEach((feature) => {
      const props = feature.properties as HeritageProperties
      if (props.vulnerability_level && counts[props.vulnerability_level] !== undefined) {
        counts[props.vulnerability_level] += 1
      }
    })
    setSummary(counts)

    const filteredCollection: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: filteredFeatures as GeoJSON.Feature[],
}

const polygons = L.geoJSON(
  filteredCollection,
  {
        pane: 'heritagePane',
        style: (feature) => {
          const props = feature?.properties as HeritageProperties
          return {
            color: riskColour(props.vulnerability_level),
            weight: 2.4,
            opacity: 1,
            fillColor: riskColour(props.vulnerability_level),
            fillOpacity: 0.22,
          }
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as HeritageProperties
          layer.on('click', () => setSelectedFeature(props))
          layer.bindPopup(`<strong>${props.name || props.identifier || 'Heritage place'}</strong><br>${props.heritage_kind || ''} heritage`)
        },
      }
    )

    const markers = L.layerGroup(
      filteredFeatures
        .map((feature) => feature.properties as HeritageProperties)
        .filter((props) => props.latitude && props.longitude)
        .map((props) => {
          const marker = L.circleMarker([props.latitude as number, props.longitude as number], {
            pane: 'heritageMarkerPane',
            radius: props.vulnerability_level === 'High' ? 9 : 7,
            color: '#ffffff',
            weight: 2,
            fillColor: riskColour(props.vulnerability_level),
            fillOpacity: 0.98,
          })
          marker.on('click', () => setSelectedFeature(props))
          marker.bindPopup(`<strong>${props.name || 'Heritage place'}</strong><br>${props.heritage_kind || ''} heritage`)
          return marker
        })
    )

    return L.layerGroup([polygons, markers])
  }

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return

    let cancelled = false

    const initialiseMap = async () => {
      try {
        const map = L.map(mapElementRef.current as HTMLDivElement, {
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

        mapRef.current = map
        createMapPanes(map)

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          crossOrigin: true,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)

        const [heritage, burn, granite, meta] = await Promise.all([
          loadJson<GeoJSON.FeatureCollection>(layerFiles.heritage),
          loadJson<GeoJSON.FeatureCollection>(layerFiles.burn),
          loadJson<GeoJSON.FeatureCollection>(layerFiles.granite),
          loadJson<Metadata>(layerFiles.metadata),
        ])

        if (cancelled) return

        dataRef.current.heritage = heritage
        setMetadata(meta)

        layersRef.current.fire = L.imageOverlay(
          `${DATA_PATH}${meta.raster_overlays.files.fire}`,
          imageBounds(meta),
          { opacity: 0.92, interactive: false, pane: 'rasterPane' }
        )

        layersRef.current.fuel = L.imageOverlay(
          `${DATA_PATH}${meta.raster_overlays.files.fuel}`,
          imageBounds(meta),
          { opacity: 0.62, interactive: false, pane: 'rasterPane' }
        )

        layersRef.current.slope = L.imageOverlay(
          `${DATA_PATH}${meta.raster_overlays.files.slope}`,
          imageBounds(meta),
          { opacity: 0.62, interactive: false, pane: 'rasterPane' }
        )

        layersRef.current.burn = L.geoJSON(burn, {
          pane: 'contextPane',
          style: {
            color: '#167d94',
            weight: 3,
            opacity: 1,
            fillColor: '#47a6b6',
            fillOpacity: 0.16,
            dashArray: '9 5',
          },
        })

        layersRef.current.granite = L.geoJSON(granite, {
          pane: 'contextPane',
          style: {
            color: '#2f3033',
            weight: 2.2,
            opacity: 0.95,
            fillColor: '#6e684b',
            fillOpacity: 0.44,
          },
        })

        layersRef.current.heritage = buildHeritageLayer(heritage, heritageKind, heritageRisk)

        L.rectangle(analysisBounds(meta), {
          color: '#202124',
          weight: 2,
          fillOpacity: 0,
          dashArray: '8 6',
          pane: 'contextPane',
        }).addTo(map)

        map.fitBounds(analysisBounds(meta), { padding: [26, 26] })

        setLoading(false)
        setTimeout(() => map.invalidateSize(), 100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load risk map data')
        setLoading(false)
      }
    }

    initialiseMap()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.entries(layersRef.current).forEach(([name, layer]) => {
      if (!layer) return
      const shouldShow = enabledLayers[name as LayerName]
      if (shouldShow && !map.hasLayer(layer)) layer.addTo(map)
      if (!shouldShow && map.hasLayer(layer)) map.removeLayer(layer)
    })
  }, [enabledLayers, loading])

  useEffect(() => {
    const map = mapRef.current
    const heritageData = dataRef.current.heritage
    if (!map || !heritageData) return

    const oldLayer = layersRef.current.heritage
    if (oldLayer && map.hasLayer(oldLayer)) map.removeLayer(oldLayer)

    const newLayer = buildHeritageLayer(heritageData, heritageKind, heritageRisk)
    layersRef.current.heritage = newLayer

    if (enabledLayers.heritage) {
      newLayer.addTo(map)
    }
  }, [heritageKind, heritageRisk])

  const toggleLayer = (layer: LayerName) => {
    setEnabledLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }))
  }

  return (
    <div className="flex h-full min-h-screen bg-[#F0EDE8]">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col px-6 py-6 overflow-y-auto flex-shrink-0">
        <h1 className="text-2xl font-black uppercase leading-tight tracking-tight mb-2">
          Heritage Fire<br />Vulnerability<br />Model
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Interactive FRK risk map using the processed MVP fire vulnerability data.
        </p>

        <div className="mb-6">
          <p className="font-bold text-base mb-3">Core Layers</p>
          {([
            ['fire', 'Fire vulnerability'],
            ['heritage', 'Heritage places'],
            ['burn', 'Burn options'],
            ['granite', 'Granite influence'],
            ['fuel', 'Fuel type'],
            ['slope', 'Slope'],
          ] as [LayerName, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabledLayers[key]}
                onChange={() => toggleLayer(key)}
                className="accent-[#8B2020]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="mb-6">
          <p className="font-bold text-base mb-3">Heritage Type</p>
          <select
            value={heritageKind}
            onChange={(event) => setHeritageKind(event.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50"
          >
            <option value="all">All heritage</option>
            <option value="Aboriginal">Aboriginal</option>
            <option value="Non-Aboriginal">Non-Aboriginal</option>
          </select>
        </div>

        <div className="mb-6">
          <p className="font-bold text-base mb-3">Risk Level</p>
          <select
            value={heritageRisk}
            onChange={(event) => setHeritageRisk(event.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50"
          >
            <option value="all">All risk levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="font-bold text-base mb-3">Visible Heritage Summary</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-[#d2302a]">{summary.High}</p>
              <p className="text-gray-500">High</p>
            </div>
            <div>
              <p className="font-bold text-[#ebae26]">{summary.Medium}</p>
              <p className="text-gray-500">Medium</p>
            </div>
            <div>
              <p className="font-bold text-[#14964b]">{summary.Low}</p>
              <p className="text-gray-500">Low</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-bold text-base mb-3">Classification</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Low: {metadata?.raster_overlays.classification?.low || 'Loading'}</p>
            <p>Medium: {metadata?.raster_overlays.classification?.medium || 'Loading'}</p>
            <p>High: {metadata?.raster_overlays.classification?.high || 'Loading'}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white border border-gray-200 p-4">
  <p className="font-bold text-base mb-3">How to Use This Map</p>
  <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
    {mapInstructions.map((instruction) => (
      <li key={instruction}>{instruction}</li>
    ))}
  </ul>
</div>

<div className="mb-6 rounded-xl bg-[#F7F2EA] border border-gray-200 p-4">
  <p className="font-bold text-base mb-3">Layer Explanations</p>
  <div className="text-xs text-gray-600 space-y-3">
    {layerExplanations.map((item) => (
      <p key={item.title}>
        <span className="font-semibold text-gray-900">{item.title}:</span>{' '}
        {item.description}
      </p>
    ))}
  </div>
</div>

        <div className="mt-auto rounded-xl bg-[#F7F2EA] border border-gray-200 p-4">
          <p className="font-bold text-sm mb-2">Selected Feature</p>
          {selectedFeature ? (
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{selectedFeature.name || selectedFeature.identifier}</p>
              <p>{selectedFeature.heritage_kind} heritage</p>
              <p>{selectedFeature.vulnerability_level} vulnerability</p>
              <p>Score: {selectedFeature.vulnerability_score ?? 'Unknown'}</p>
              <p>Region: {selectedFeature.region || 'Unknown'}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Click a heritage site on the map to view details.</p>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapElementRef} className="h-full w-full min-h-screen" />

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
            <p className="text-sm text-gray-600">Loading real FRK risk map...</p>
          </div>
        )}

        {error && (
          <div className="absolute top-6 left-6 right-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl z-[1000]">
            {error}
          </div>
        )}

             <div className="absolute bottom-6 right-6 w-72 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-4 z-[900]">
          <p className="font-bold text-sm mb-2">Fire Vulnerability Legend</p>
          <p className="text-[11px] text-gray-500 mb-3">
            Colours indicate the relative vulnerability level used to prioritise heritage places on the map.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-[#d2302a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">High vulnerability</p>
                <p className="text-gray-500">Higher priority areas for review and mitigation planning.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ebae26] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Medium vulnerability</p>
                <p className="text-gray-500">Moderate vulnerability based on the processed risk layer.</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-[#14964b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Low vulnerability</p>
                <p className="text-gray-500">Lower vulnerability compared with other mapped areas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskMap