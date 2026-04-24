import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Sidebar from '../../src/components/layout/Sidebar'

describe('Sidebar', () => {
  it('renders the project branding and all primary navigation links', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    const sidebar = container.querySelector('aside')

    expect(sidebar).not.toBeNull()
    expect(sidebar).toHaveTextContent(/Fire Vulnerability\s*Assessment Tool/)
    expect(screen.getByText('Franklin District · WA')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Risk Map' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Model Insights' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fire Risk Regulation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Heritage Registry' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Site Assessment' })).toBeInTheDocument()
  })
})
