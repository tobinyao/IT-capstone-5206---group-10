// Authentication API client.
//
// Wraps the backend sign-in endpoint so the rest of the app can call a
// single typed function instead of dealing with fetch, JSON parsing and
// error shaping at every call site.
//
// Configuration:
//   VITE_API_BASE_URL — optional. When set (e.g. "https://api.example.com")
//     all requests are issued against that origin. When unset, requests
//     go to the same origin and a reverse proxy / dev server is expected
//     to forward /api/* to the backend.

// Strip a trailing slash so we never produce double slashes when joining
// the base with the path.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export type AuthUser = {
  id?: string | number
  email?: string
  name?: string
  role?: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

/**
 * POST /api/login
 *
 * Sends the user's credentials to the backend and resolves with the
 * returned `{ token, user }` payload on success.
 *
 * Any non-2xx response or network failure is converted into a thrown
 * Error whose `message` is suitable for showing directly to the user
 * (it will prefer the backend's `message` / `error` field when present).
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    // fetch() rejects only on network failure, CORS error, abort, etc.
    // Anything that came back with an HTTP status will be handled below.
    throw new Error('Unable to reach the server. Please check your connection and try again.')
  }

  const body = await safeParseJson(response)

  if (!response.ok) {
    const message = pickMessage(body) || response.statusText || 'Sign in failed.'
    throw new Error(message)
  }

  if (
    !body ||
    typeof body.token !== 'string' ||
    !body.user ||
    typeof body.user !== 'object'
  ) {
    throw new Error('Unexpected response from the server.')
  }

  return {
    token: body.token,
    user: body.user as AuthUser,
  }
}

// Parse the response body as JSON, tolerating empty / non-JSON bodies
// (which can happen on 204s, 5xx HTML error pages, etc.).
async function safeParseJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text()
  if (!text) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

// Pull a human-readable error message out of a parsed JSON body, looking
// at the two field names backends most commonly use.
function pickMessage(body: Record<string, unknown> | null): string | null {
  if (!body) return null
  if (typeof body.message === 'string') return body.message
  if (typeof body.error === 'string') return body.error
  return null
}
