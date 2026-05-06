import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    Tooltip,
    Legend,
  } from 'chart.js'
  import { Bar, Scatter } from 'react-chartjs-2'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    Tooltip,
    Legend
  )

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
    return (
      <div className="flex flex-col px-8 py-8 overflow-y-auto h-full gap-4" style={{ background: '#F0EDE8' }}>

        {/* Title */}
        <h1 className="text-3xl font-black text-center mb-2">Heritage Fire Vulnerability Model Insights</h1>

      </div>
    )
  }

  export default ModelInsights
