import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function SmokeComponent() {
  return <div>Frontend testing setup is working</div>
}

describe('frontend testing setup', () => {
  it('renders a simple React component', () => {
    render(<SmokeComponent />)

    expect(screen.getByText('Frontend testing setup is working')).toBeInTheDocument()
  })
})
