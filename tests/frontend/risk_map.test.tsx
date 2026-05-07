import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import RiskMap from '../../src/pages/RiskMap'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
  delete window.L
})

describe('RiskMap page', () => {
  it('renders the FireWatch MVP layout inside the Risk Map page', () => {
    const { container } = render(<RiskMap />)
    const pageHeading = container.querySelector('h1')

    expect(pageHeading).not.toBeNull()
    expect(pageHeading).toHaveTextContent(/FireWatch Heritage map/)
    expect(screen.getByText(/Prioritise heritage places by fuel exposure/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Map Layers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Base Map' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Layer Key' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Score Method' })).toBeInTheDocument()
    expect(screen.getByText('Heritage risk filter')).toBeInTheDocument()
    expect(screen.getByText('Heritage type filter')).toBeInTheDocument()
    expect(screen.getByText('Select a heritage place')).toBeInTheDocument()
  })

  it('keeps the expected default layer visibility toggles', () => {
    render(<RiskMap />)

    expect(screen.getByLabelText('Fire vulnerability')).toBeChecked()
    expect(screen.getByLabelText('Heritage places')).toBeChecked()
    expect(screen.getByLabelText('Burn options')).not.toBeChecked()
    expect(screen.getByLabelText('Granite influence')).not.toBeChecked()
    expect(screen.getByLabelText('Fuel type')).not.toBeChecked()
    expect(screen.getByLabelText('Slope')).not.toBeChecked()
  })

  it('lets the user switch between OpenStreetMap and Satellite base maps', async () => {
    const user = userEvent.setup()
    render(<RiskMap />)

    const openStreetMapButton = screen.getByRole('button', { name: 'OpenStreetMap' })
    const satelliteButton = screen.getByRole('button', { name: 'Satellite' })

    expect(openStreetMapButton).toHaveClass('is-active')
    expect(satelliteButton).not.toHaveClass('is-active')

    await user.click(satelliteButton)

    expect(satelliteButton).toHaveClass('is-active')
    expect(openStreetMapButton).not.toHaveClass('is-active')
  })

  it('applies loaded metadata labels when the processed Risk Map data loads successfully', async () => {
    vi.stubEnv('MODE', 'development')
    window.L = createLeafletStub()

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith('/api/processed-metadata')) {
        return responseOk({
          analysis_bounds_epsg_7844: [116, -35, 118, -34],
          counts: { heritage_levels: { High: 4, Medium: 2, Low: 1 } },
          raster_overlays: {
            bounds_epsg_7844: [116, -35, 118, -34],
            classification: {
              high: 'critical hotspots',
              medium: 'watch areas',
              low: 'background areas',
            },
            files: {
              fire: 'fire_overlay.png',
              fuel: 'fuel_overlay.png',
              slope: 'slope_overlay.png',
            },
          },
        })
      }

      if (url.endsWith('/api/layers/heritage')) {
        return responseOk({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [117.1, -34.6] },
              properties: {
                identifier: 'FRK-001',
                name: 'Heritage Place 1',
                heritage_kind: 'Aboriginal',
                vulnerability_level: 'High',
                vulnerability_score: 88,
              },
            },
          ],
        })
      }

      if (url.endsWith('/api/layers/burn-options')) {
        return responseOk({
          type: 'FeatureCollection',
          features: [],
        })
      }

      if (url.endsWith('/api/layers/granite')) {
        return responseOk({
          type: 'FeatureCollection',
          features: [],
        })
      }

      throw new Error(`Unexpected fetch request: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    const { default: LiveRiskMap } = await import('../../src/pages/RiskMap')
    render(<LiveRiskMap />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))

    expect(await screen.findByText('critical hotspots')).toBeInTheDocument()
    expect(screen.getByText('watch areas')).toBeInTheDocument()
    expect(screen.getByText('background areas')).toBeInTheDocument()
    expect(screen.queryByText('Could not load processed Risk Map data.')).not.toBeInTheDocument()
  })

  it('shows an error overlay when the processed Risk Map data request fails', async () => {
    vi.stubEnv('MODE', 'development')
    window.L = createLeafletStub()

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        if (url.endsWith('/api/processed-metadata')) {
          return {
            ok: false,
            json: async () => ({}),
          }
        }

        return responseOk({
          type: 'FeatureCollection',
          features: [],
        })
      })
    )

    const { default: LiveRiskMap } = await import('../../src/pages/RiskMap')
    render(<LiveRiskMap />)

    expect(await screen.findByText('Could not load processed Risk Map data.')).toBeInTheDocument()
  })
})

function responseOk(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  }
}

function createLeafletStub() {
  const makeLayer = () => ({
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  })

  const panes = new Map<string, { style: Record<string, string> }>()
  const map = {
    setView: vi.fn().mockReturnThis(),
    createPane: vi.fn((name: string) => {
      panes.set(name, { style: {} })
      return map
    }),
    getPane: vi.fn((name: string) => {
      if (!panes.has(name)) {
        panes.set(name, { style: {} })
      }
      return panes.get(name)
    }),
    hasLayer: vi.fn(() => false),
    removeLayer: vi.fn(),
    remove: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  }

  return {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => makeLayer()),
    imageOverlay: vi.fn(() => makeLayer()),
    geoJSON: vi.fn(() => makeLayer()),
    layerGroup: vi.fn(() => makeLayer()),
    rectangle: vi.fn(() => makeLayer()),
    marker: vi.fn(() => makeLayer()),
    circleMarker: vi.fn(() => makeLayer()),
    divIcon: vi.fn(() => ({})),
  }
}
