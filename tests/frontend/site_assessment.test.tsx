import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SiteAssessment from '../../src/pages/SiteAssessment'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SiteAssessment page', () => {
  it('shows the default calculated high-risk result and recommended actions', () => {
    render(<SiteAssessment />)

    expect(screen.getByRole('heading', { name: 'Site Assessment' })).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(
      screen.getByText('Emergency documentation of all site surfaces immediately')
    ).toBeInTheDocument()
    expect(screen.getAllByText('Open forest').length).toBeGreaterThan(0)
    expect(screen.getByText('28° · Very steep')).toBeInTheDocument()
  })

  it('recalculates the result when the user chooses lower-risk inputs', async () => {
    const user = userEvent.setup()
    render(<SiteAssessment />)

    const [heritageTypeSelect, , fuelTypeSelect] = screen.getAllByRole('combobox')

    await user.selectOptions(heritageTypeSelect, 'Brick / stone / masonry / concrete')
    await user.selectOptions(fuelTypeSelect, 'Water')

    const slopeSlider = screen.getByRole('slider')
    fireEvent.change(slopeSlider, { target: { value: '0' } })

    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
    expect(
      screen.getByText('Maintain routine 6-monthly monitoring schedule')
    ).toBeInTheDocument()
    expect(screen.getByText('0° · Low')).toBeInTheDocument()
  })

  it('exports a CSV that includes the entered site details', async () => {
    const user = userEvent.setup()
    const createElement = document.createElement.bind(document)
    const createdAnchors: HTMLAnchorElement[] = []

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = createElement(tagName)
      if (tagName === 'a' && element instanceof HTMLAnchorElement) {
        createdAnchors.push(element)
      }
      return element
    })

    render(<SiteAssessment />)

    await user.type(screen.getByPlaceholderText('Enter site name'), 'Franklin Rock Shelter')
    await user.type(screen.getByPlaceholderText('e.g. FRK-094'), 'FRK-094')
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(createdAnchors).toHaveLength(1)
    expect(createdAnchors[0].download).toBe('assessment_FRK-094.csv')

    const csvHref = decodeURIComponent(createdAnchors[0].href)
    expect(csvHref).toContain('Site Name,Franklin Rock Shelter')
    expect(csvHref).toContain('Site ID,FRK-094')
    expect(csvHref).toContain('Vulnerability Level,High')
  })
})
