import { useEffect, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
  } from 'chart.js'
  import { Bar, Scatter } from 'react-chartjs-2'

  // Register every Chart.js piece the upcoming Model Insights charts need:
  //   - Bar (Risk Level Distribution, Average Risk Driver Scores)
  //   - Doughnut (Model Weight Breakdown) -> ArcElement
  //   - Scatter (Slope vs Vulnerability Score) -> PointElement, LineElement
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend
  )

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'

  type RiskLevel = 'High' | 'Medium' | 'Low'

  type HeritageVulnerabilityWeights = {
    fuel_risk: number
    slope_risk: number
    heritage_type_material_risk: number
    burn_management_context: number
  }

  type ProcessedMetadata = {
    counts: {
      heritage_levels: Record<RiskLevel, number>
    }
    score_formula: {
      heritage_vulnerability: HeritageVulnerabilityWeights
    }
  }

  type HeritageFeatureProperties = {
    vulnerability_score?: number | null
    vulnerability_level?: RiskLevel
    fuel_risk?: number | null
    slope_risk?: number | null
    heritage_type_risk?: number | null
    slope_degrees?: number | null
    burn_management_context?: string
  }

  type HeritageFeature = {
    type: string
    geometry: unknown
    properties: HeritageFeatureProperties
  }

  type HeritageFeatureCollection = {
    type: 'FeatureCollection'
    features: HeritageFeature[]
  }

  // Burn context text -> numeric risk mapping (0-100 scale).
  // Used as a temporary fallback because /api/layers/heritage does not
  // currently expose a numeric burn_context_risk field on heritage features.
  // Any value not in this map (other strings, empty, null, undefined) is
  // skipped when computing the average burn-context risk in Model Insights.
  // TODO: replace with backend burn_context_risk (issue #62)
  const BURN_CONTEXT_RISK_MAP: Record<string, number> = {
    'Inside DBCA burn option area': 30, // covered by a burn option -> lower risk
    'No burn option overlap': 70,       // no burn management -> higher risk
  }

  const ModelInsights = () => {
    const [metadata, setMetadata] = useState<ProcessedMetadata | null>(null)
    const [heritageFeatures, setHeritageFeatures] = useState<HeritageFeature[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load Model Insights data from the backend on mount. The two endpoints
    // are fetched in parallel:
    //   - /api/processed-metadata: heritage-level counts and model weights
    //   - /api/layers/heritage:    per-site risk drivers (GeoJSON)
    // The `active` flag prevents setState after the component unmounts.
    useEffect(() => {
      let active = true

      async function loadData() {
        try {
          const [metadataResponse, heritageResponse] = await Promise.all([
            fetch(`${API_BASE}/api/processed-metadata`),
            fetch(`${API_BASE}/api/layers/heritage`),
          ])

          if (!metadataResponse.ok || !heritageResponse.ok) {
            throw new Error('Could not load Model Insights data.')
          }

          const [metadataJson, heritageJson] = (await Promise.all([
            metadataResponse.json(),
            heritageResponse.json(),
          ])) as [ProcessedMetadata, HeritageFeatureCollection]

          if (!active) return

          setMetadata(metadataJson)
          setHeritageFeatures(heritageJson.features ?? [])
          setError(null)
        } catch {
          if (active) {
            setError('Could not load Model Insights data.')
          }
        } finally {
          if (active) {
            setLoading(false)
          }
        }
      }

      loadData()

      return () => {
        active = false
      }
    }, [])

    return (
      <div className="flex flex-col px-8 py-8 overflow-y-auto h-full gap-4" style={{ background: '#F0EDE8' }}>

        {/* Title */}
        <h1 className="text-3xl font-black text-center mb-2">Heritage Fire Vulnerability Model Insights</h1>

      </div>
    )
  }

  export default ModelInsights
