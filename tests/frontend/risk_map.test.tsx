import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import RiskMap from '../../src/pages/RiskMap'

afterEach(() => {
  cleanup()
})

describe('RiskMap page', () => {
  it('renders the FireWatch MVP layout inside the Risk Map page', () => {
    const { container } = render(<RiskMap />)
    const pageHeading = container.querySelector('h1')

    expect(pageHeading).not.toBeNull()
    expect(pageHeading).toHaveTextContent(/FireWatch Heritage map/)
    expect(screen.getByText(/Prioritise heritage places by fuel exposure/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Map Layers' })).toBeInTheDocument()
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
})
