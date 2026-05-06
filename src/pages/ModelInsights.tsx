import { useEffect, useMemo, useState } from 'react'
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
  import { Bar, Doughnut, Scatter } from 'react-chartjs-2'

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

  // Risk levels in display order. Charts that bucket by level (Risk Level
  // Distribution and Slope vs Vulnerability) iterate this array so colors
  // and ordering stay consistent across the page.
  const RISK_LEVELS = ['High', 'Medium', 'Low'] as const

  // Shared risk-level palette. Mirrors the colors used on the RiskMap page
  // so the same heritage site reads the same way across the app.
  const LEVEL_COLORS: Record<'High' | 'Medium' | 'Low', string> = {
    High: '#d2302a',
    Medium: '#ebae26',
    Low: '#14964b',
  }

  // Categorical palette for the four risk drivers (Fuel / Slope / Heritage
  // Type / Burn Context). Used by the Model Weight Breakdown doughnut and
  // the Average Risk Driver Scores horizontal bar so the same driver keeps
  // the same color across both charts.
  const DRIVER_COLORS = {
    fuel: '#d2302a',
    slope: '#5B8FD4',
    heritageType: '#2E8B57',
    burnContext: '#ebae26',
  } as const

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

  // Arithmetic mean over an array of finite numbers. Returns 0 for an empty
  // array so chart datasets always render a numeric value (the chart itself
  // can be hidden by the parent when there is no data to show).
  const average = (values: number[]): number => {
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  // Chart.js options. Defined at module scope (not inside the component) so
  // the same object reference is reused across renders and Chart.js does not
  // need to diff a new options tree on every state update.

  // Chart 1 - Risk Level Distribution (vertical bar).
  const riskLevelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Heritage sites' },
      },
    },
  }

  // Chart 2 - Model Weight Breakdown (doughnut). Legend at the bottom keeps
  // labels readable next to the small chart area.
  const modelWeightChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
  }

  // Chart 3 - Average Risk Driver Scores (horizontal bar). indexAxis: 'y'
  // turns Chart.js Bar into a horizontal bar; the x-axis is locked to 0-100
  // because every driver score is normalised to that range.
  const averageRiskDriverChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Average risk score (0-100)' },
      },
    },
  }

  // Chart 4 - Slope vs Vulnerability Score (scatter). y-axis is locked to
  // 0-100 to match the vulnerability score scale; x-axis is left auto so the
  // dataset's actual slope range drives the view.
  const slopeVsVulnerabilityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
    scales: {
      x: { title: { display: true, text: 'Slope (degrees)' } },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Vulnerability score (0-100)' },
      },
    },
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

    // Chart 1 - Risk Level Distribution.
    // Reads metadata.counts.heritage_levels and emits a single Bar dataset
    // ordered High / Medium / Low, colored with the shared LEVEL_COLORS.
    const riskLevelChartData = useMemo(() => {
      if (!metadata) return null
      const counts = metadata.counts.heritage_levels
      return {
        labels: RISK_LEVELS.map((level) => level),
        datasets: [
          {
            label: 'Heritage sites',
            data: RISK_LEVELS.map((level) => counts[level] ?? 0),
            backgroundColor: RISK_LEVELS.map((level) => LEVEL_COLORS[level]),
            borderRadius: 4,
          },
        ],
      }
    }, [metadata])

    // Chart 2 - Model Weight Breakdown.
    // Reads the four heritage_vulnerability weights and turns each one into a
    // doughnut slice. Labels include the percentage so the legend stays
    // readable even when the chart is small.
    const modelWeightChartData = useMemo(() => {
      if (!metadata) return null
      const weights = metadata.score_formula.heritage_vulnerability
      const slices: Array<{
        key: keyof HeritageVulnerabilityWeights
        label: string
        color: string
      }> = [
        { key: 'fuel_risk', label: 'Fuel Risk', color: DRIVER_COLORS.fuel },
        { key: 'slope_risk', label: 'Slope Risk', color: DRIVER_COLORS.slope },
        {
          key: 'heritage_type_material_risk',
          label: 'Heritage Type / Material Risk',
          color: DRIVER_COLORS.heritageType,
        },
        {
          key: 'burn_management_context',
          label: 'Burn Context',
          color: DRIVER_COLORS.burnContext,
        },
      ]
      return {
        labels: slices.map(
          ({ key, label }) => `${label} (${Math.round((weights[key] ?? 0) * 100)}%)`
        ),
        datasets: [
          {
            data: slices.map(({ key }) => Math.round((weights[key] ?? 0) * 100)),
            backgroundColor: slices.map(({ color }) => color),
            borderWidth: 0,
          },
        ],
      }
    }, [metadata])

    // Chart 3 - Average Risk Driver Scores.
    // Walks every heritage feature and collects four numeric series:
    //   - fuel_risk, slope_risk, heritage_type_risk: read directly (already
    //     0-100) and filtered to finite numbers.
    //   - burn_context: text from burn_management_context, looked up in
    //     BURN_CONTEXT_RISK_MAP. Anything not in the map is skipped, which
    //     is the documented Step 6 behaviour ("filter null/NaN").
    // The four resulting averages render as a single horizontal bar dataset.
    const averageRiskDriverChartData = useMemo(() => {
      if (heritageFeatures.length === 0) return null

      const fuelValues: number[] = []
      const slopeValues: number[] = []
      const heritageTypeValues: number[] = []
      const burnContextValues: number[] = []

      for (const feature of heritageFeatures) {
        const props = feature.properties

        if (typeof props.fuel_risk === 'number' && Number.isFinite(props.fuel_risk)) {
          fuelValues.push(props.fuel_risk)
        }
        if (typeof props.slope_risk === 'number' && Number.isFinite(props.slope_risk)) {
          slopeValues.push(props.slope_risk)
        }
        if (
          typeof props.heritage_type_risk === 'number' &&
          Number.isFinite(props.heritage_type_risk)
        ) {
          heritageTypeValues.push(props.heritage_type_risk)
        }

        const burnContextText = props.burn_management_context
        if (typeof burnContextText === 'string' && burnContextText in BURN_CONTEXT_RISK_MAP) {
          burnContextValues.push(BURN_CONTEXT_RISK_MAP[burnContextText])
        }
      }

      return {
        labels: ['Fuel Risk', 'Slope Risk', 'Heritage Type Risk', 'Burn Context Risk'],
        datasets: [
          {
            label: 'Average score',
            data: [
              average(fuelValues),
              average(slopeValues),
              average(heritageTypeValues),
              average(burnContextValues),
            ],
            backgroundColor: [
              DRIVER_COLORS.fuel,
              DRIVER_COLORS.slope,
              DRIVER_COLORS.heritageType,
              DRIVER_COLORS.burnContext,
            ],
            borderRadius: 4,
          },
        ],
      }
    }, [heritageFeatures])

    // Chart 4 - Slope vs Vulnerability Score.
    // Splits heritage features into one dataset per vulnerability_level so the
    // scatter plot is colored by risk level (High / Medium / Low). Points
    // missing slope_degrees, vulnerability_score, or vulnerability_level are
    // dropped so Chart.js does not have to deal with NaN coordinates.
    const slopeVsVulnerabilityChartData = useMemo(() => {
      if (heritageFeatures.length === 0) return null

      const pointsByLevel: Record<RiskLevel, Array<{ x: number; y: number }>> = {
        High: [],
        Medium: [],
        Low: [],
      }

      for (const feature of heritageFeatures) {
        const { slope_degrees, vulnerability_score, vulnerability_level } = feature.properties

        if (
          typeof slope_degrees === 'number' &&
          Number.isFinite(slope_degrees) &&
          typeof vulnerability_score === 'number' &&
          Number.isFinite(vulnerability_score) &&
          (vulnerability_level === 'High' ||
            vulnerability_level === 'Medium' ||
            vulnerability_level === 'Low')
        ) {
          pointsByLevel[vulnerability_level].push({
            x: slope_degrees,
            y: vulnerability_score,
          })
        }
      }

      return {
        datasets: RISK_LEVELS.map((level) => ({
          label: level,
          data: pointsByLevel[level],
          backgroundColor: LEVEL_COLORS[level],
          pointRadius: 5,
          pointHoverRadius: 7,
        })),
      }
    }, [heritageFeatures])

    return (
      <div className="flex flex-col px-8 py-8 overflow-y-auto h-full gap-4" style={{ background: '#F0EDE8' }}>

        {/* Title */}
        <h1 className="text-3xl font-black text-center mb-2">Heritage Fire Vulnerability Model Insights</h1>

        {/* Loading state: four skeleton cards in the same 2x2 grid the real
            charts will use, so the layout does not jump when data arrives. */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 h-80 animate-pulse"
                aria-hidden="true"
              >
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-2/3 bg-gray-100 rounded mb-6" />
                <div className="h-48 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error state: a single full-width banner. Satisfies issue #62
            acceptance criterion "show a user-friendly error message if API
            data cannot be loaded". */}
        {!loading && error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6"
          >
            <p className="font-semibold">Could not load Model Insights data.</p>
            <p className="text-sm mt-1">
              Please check that the backend API is running, then refresh the page.
            </p>
          </div>
        )}

        {/* Charts: 2x2 grid of cards. Each card has a fixed-height chart
            container so Chart.js (with maintainAspectRatio: false) renders at
            a predictable size inside the grid. */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Chart 1 - Risk Level Distribution */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-1">Risk Level Distribution</h3>
              <p className="text-sm text-gray-500 mb-4">
                Number of heritage sites in each vulnerability level.
              </p>
              <div className="h-64">
                {riskLevelChartData && (
                  <Bar data={riskLevelChartData} options={riskLevelChartOptions} />
                )}
              </div>
            </div>

            {/* Chart 2 - Model Weight Breakdown */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-1">Model Weight Breakdown</h3>
              <p className="text-sm text-gray-500 mb-4">
                Weights used to calculate the heritage vulnerability score.
              </p>
              <div className="h-64">
                {modelWeightChartData && (
                  <Doughnut
                    data={modelWeightChartData}
                    options={modelWeightChartOptions}
                  />
                )}
              </div>
            </div>

            {/* Chart 3 - Average Risk Driver Scores */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-1">Average Risk Driver Scores</h3>
              <p className="text-sm text-gray-500 mb-4">
                Mean score for each risk driver across all heritage sites (0-100).
              </p>
              <div className="h-64">
                {averageRiskDriverChartData && (
                  <Bar
                    data={averageRiskDriverChartData}
                    options={averageRiskDriverChartOptions}
                  />
                )}
              </div>
            </div>

            {/* Chart 4 - Slope vs Vulnerability Score */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-bold mb-1">Slope vs Vulnerability Score</h3>
              <p className="text-sm text-gray-500 mb-4">
                Each point is one heritage site, colored by its vulnerability level.
              </p>
              <div className="h-64">
                {slopeVsVulnerabilityChartData && (
                  <Scatter
                    data={slopeVsVulnerabilityChartData}
                    options={slopeVsVulnerabilityChartOptions}
                  />
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    )
  }

  export default ModelInsights
