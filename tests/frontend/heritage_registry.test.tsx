import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HeritagRegistry from '../../src/pages/HeritagRegistry'

vi.mock('../../src/components/AddSiteModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-site-modal">Add Site Modal</div> : null,
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('HeritageRegistry page', () => {
  it('loads heritage data and renders summary cards plus site rows', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(sampleHeritageData)))

    render(<HeritagRegistry />)

    expect(screen.getByText('Loading heritage registry data...')).toBeInTheDocument()

    expect(await screen.findByText('Showing 3 of 3 heritage places')).toBeInTheDocument()
    expect(screen.getByText('Total sites').parentElement).toHaveTextContent('3')
    expect(screen.getByText('High vulnerability').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Medium vulnerability').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Low vulnerability').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Franklin Rock Shelter')).toBeInTheDocument()
    expect(screen.getByText('Albany Cottage')).toBeInTheDocument()
    expect(screen.getByText('Heritage Well')).toBeInTheDocument()
  })

  it('filters registry results by search text, vulnerability, heritage kind, and source', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(sampleHeritageData)))

    render(<HeritagRegistry />)

    expect(await screen.findByText('Showing 3 of 3 heritage places')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search sites...'), 'Rock')
    expect(screen.getByText('Showing 1 of 3 heritage places')).toBeInTheDocument()
    expect(screen.getByText('Franklin Rock Shelter')).toBeInTheDocument()
    expect(screen.queryByText('Albany Cottage')).not.toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Search sites...'))

    const [vulnerabilitySelect, heritageKindSelect, sourceSelect] = screen.getAllByRole('combobox')

    await user.selectOptions(vulnerabilitySelect, 'Low')
    expect(screen.getByText('Showing 1 of 3 heritage places for Low')).toBeInTheDocument()
    expect(screen.getByText('Heritage Well')).toBeInTheDocument()

    await user.selectOptions(vulnerabilitySelect, 'All vulnerability')
    await user.selectOptions(heritageKindSelect, 'Aboriginal')
    expect(screen.getByText('Showing 2 of 3 heritage places for Aboriginal')).toBeInTheDocument()
    expect(screen.queryByText('Albany Cottage')).not.toBeInTheDocument()

    await user.selectOptions(heritageKindSelect, 'All heritage')
    await user.selectOptions(sourceSelect, 'User submitted')
    expect(screen.getByText('Showing 1 of 3 heritage places for User submitted')).toBeInTheDocument()
    expect(screen.getByText('Heritage Well')).toBeInTheDocument()
    expect(screen.getByText('submitted by Alex Ranger')).toBeInTheDocument()
  })

  it('downloads the loaded heritage registry data as csv', async () => {
    const user = userEvent.setup()
    const createElement = document.createElement.bind(document)
    const createdAnchors: HTMLAnchorElement[] = []

    vi.stubGlobal('fetch', vi.fn(async () => okResponse(sampleHeritageData)))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:heritage-csv')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = createElement(tagName)
      if (tagName === 'a' && element instanceof HTMLAnchorElement) {
        createdAnchors.push(element)
      }
      return element
    })

    render(<HeritagRegistry />)
    await screen.findByText('Showing 3 of 3 heritage places')

    await user.click(screen.getByRole('button', { name: /Download heritage data/i }))

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1))
    expect(createdAnchors).toHaveLength(1)
    expect(createdAnchors[0].download).toBe('heritage_registry.csv')
    expect(createdAnchors[0].href).toBe('blob:heritage-csv')
  })

  it('shows a friendly error when heritage registry data cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({}),
      }))
    )

    render(<HeritagRegistry />)

    expect(
      await screen.findByText('Could not load heritage registry data.')
    ).toBeInTheDocument()
    expect(screen.getByText('No heritage places match the selected filters')).toBeInTheDocument()
  })
})

function okResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  }
}

const sampleHeritageData = {
  features: [
    {
      properties: {
        identifier: 'FRK-001',
        name: 'Franklin Rock Shelter',
        place_type: 'Rock shelter',
        heritage_kind: 'Aboriginal',
        slope_degrees: 18.5,
        fuel_class: 'Open forest',
        burn_management_context: 'Inside DBCA burn option area',
        vulnerability_level: 'High',
        vulnerability_score: 88,
        source: 'ACHIS',
      },
    },
    {
      properties: {
        identifier: 'FRK-002',
        name: 'Albany Cottage',
        place_type: 'Historic house',
        heritage_kind: 'Non-Aboriginal',
        slope_degrees: 7.2,
        fuel_class: 'Grassland',
        burn_management_context: 'No burn option overlap',
        vulnerability_level: 'Medium',
        vulnerability_score: 56,
        source: 'DPLH006',
      },
    },
    {
      properties: {
        identifier: 'FRK-003',
        name: 'Heritage Well',
        place_type: 'Water source',
        heritage_kind: 'Aboriginal',
        slope_degrees: 3.1,
        fuel_class: 'Wetland',
        burn_management_context: 'No burn option overlap',
        vulnerability_level: 'Low',
        vulnerability_score: 24,
        source: 'user',
        added_by_user_name: 'Alex Ranger',
      },
    },
  ],
}
