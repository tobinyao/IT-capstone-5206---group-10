import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'

describe('App', () => {
  it('renders the main frontend shell with the default Risk Map page', () => {
    const { container } = render(<App />)
    const sidebar = container.querySelector('aside')

    expect(sidebar).not.toBeNull()
    expect(sidebar).toHaveTextContent(/Fire Vulnerability\s*Assessment Tool/)
    expect(screen.getByText('Risk Map')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FireWatch Heritage map' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Map Layers' })).toBeInTheDocument()
  })
})
