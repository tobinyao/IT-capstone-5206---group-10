import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => {
  cleanup()
})

function CounterHarness() {
  const [count, setCount] = useState(0)

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  )
}

describe('frontend testing foundation', () => {
  it('provides a browser-like jsdom environment', () => {
    expect(window).toBeDefined()
    expect(document).toBeDefined()
    expect(document.body).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('loads jest-dom matchers from the shared setup file', () => {
    render(
      <section>
        <h2>Testing foundation ready</h2>
      </section>
    )

    expect(screen.getByRole('heading', { name: 'Testing foundation ready' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Testing foundation ready' })).toHaveTextContent(
      'Testing foundation ready'
    )
  })

  it('supports basic React rendering and user interaction', async () => {
    const user = userEvent.setup()
    render(<CounterHarness />)

    const counterButton = screen.getByRole('button', { name: 'Count: 0' })
    expect(counterButton).toBeInTheDocument()

    await user.click(counterButton)

    expect(screen.getByRole('button', { name: 'Count: 1' })).toBeInTheDocument()
  })
})
