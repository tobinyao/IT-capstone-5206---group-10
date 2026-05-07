import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ModelInsights from '../../src/pages/ModelInsights'

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: { data?: { labels?: string[] } }) => (
    <div data-testid="chart-bar">{data?.labels?.join(',') ?? 'bar-chart'}</div>
  ),
  Doughnut: ({ data }: { data?: { labels?: string[] } }) => (
    <div data-testid="chart-doughnut">{data?.labels?.join(',') ?? 'doughnut-chart'}</div>
  ),
  Scatter: ({ data }: { data?: { datasets?: Array<{ label?: string }> } }) => (
    <div data-testid="chart-scatter">
      {data?.datasets?.map((dataset) => dataset.label).join(',') ?? 'scatter-chart'}
    </div>
  ),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ModelInsights page', () => {
  it('shows loading skeleton cards before API data resolves', () => {
    const never = new Promise(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(() => never)
    )

    const { container } = render(<ModelInsights />)

    expect(
      screen.getByRole('heading', { name: 'Heritage Fire Vulnerability Model Insights' })
    ).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders the chart sections after loading backend data successfully', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith('/api/processed-metadata')) {
        return okResponse({
          counts: {
            heritage_levels: {
              High: 3,
              Medium: 2,
              Low: 1,
            },
          },
          score_formula: {
            heritage_vulnerability: {
              fuel_risk: 0.45,
              slope_risk: 0.25,
              heritage_type_material_risk: 0.25,
              burn_management_context: 0.05,
            },
          },
        })
      }

      if (url.endsWith('/api/layers/heritage')) {
        return okResponse({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: null,
              properties: {
                vulnerability_score: 80,
                vulnerability_level: 'High',
                fuel_risk: 90,
                slope_risk: 70,
                heritage_type_risk: 60,
                slope_degrees: 22,
                burn_management_context: 'Inside DBCA burn option area',
              },
            },
            {
              type: 'Feature',
              geometry: null,
              properties: {
                vulnerability_score: 42,
                vulnerability_level: 'Low',
                fuel_risk: 20,
                slope_risk: 18,
                heritage_type_risk: 35,
                slope_degrees: 6,
                burn_management_context: 'No burn option overlap',
              },
            },
          ],
        })
      }

      throw new Error(`Unexpected fetch request: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<ModelInsights />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(await screen.findByText('Risk Level Distribution')).toBeInTheDocument()
    expect(screen.getByText('Model Weight Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Average Risk Driver Scores')).toBeInTheDocument()
    expect(screen.getByText('Slope vs Vulnerability Score')).toBeInTheDocument()

    const barCharts = screen.getAllByTestId('chart-bar')
    expect(barCharts[0]).toHaveTextContent('High,Medium,Low')
    expect(barCharts[1]).toHaveTextContent(
      'Fuel Risk,Slope Risk,Heritage Type Risk,Burn Context Risk'
    )
    expect(screen.getByTestId('chart-doughnut')).toHaveTextContent('Fuel Risk (45%)')
    expect(screen.getByTestId('chart-scatter')).toHaveTextContent('High,Medium,Low')
  })

  it('shows a user-friendly error state when API data cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({}),
      }))
    )

    render(<ModelInsights />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText("We couldn't load Model Insights data.")).toBeInTheDocument()
    expect(
      screen.getByText('Please check that the backend API is running and try again.')
    ).toBeInTheDocument()
  })
})

function okResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  }
}
