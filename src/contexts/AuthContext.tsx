// AuthContext / AuthProvider / useAuth
//
// Holds the signed-in user and token in React state, persists them to
// localStorage so the session survives a page reload, and exposes
// `login` and `logout` actions to the rest of the app.
//
// Components should read auth via the `useAuth()` hook rather than
// touching localStorage directly so the in-memory state and the stored
// state cannot drift apart.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  login as loginRequest,
  type AuthUser,
  type LoginResponse,
} from '../api/auth'

// Namespaced keys so the app's storage entries are easy to spot in
// devtools and unlikely to collide with other tools on the same origin.
const TOKEN_STORAGE_KEY = 'fvat.auth.token'
const USER_STORAGE_KEY = 'fvat.auth.user'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Read the persisted token. Wrapped in try/catch because localStorage
// access can throw (Safari private mode, disabled storage, SSR, ...).
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

// Read and JSON-parse the persisted user object, defending against
// corrupted or non-object payloads.
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as AuthUser
    }
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initialisers so localStorage is only read once on mount.
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(async (email: string, password: string) => {
    // Errors from the API are intentionally propagated to the caller
    // (the login form) so it can render the message inline.
    const result = await loginRequest(email, password)
    setToken(result.token)
    setUser(result.user)
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user))
    } catch {
      // localStorage can throw when quota is exceeded or storage is
      // disabled. The session still works in memory for this tab.
    }
    return result
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // Ignore storage failures — in-memory state is already cleared.
    }
  }, [])

  // Cross-tab sync: if the user logs in or out in another tab, mirror
  // that change here so every open tab agrees on the auth state.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        setToken(readStoredToken())
      } else if (e.key === USER_STORAGE_KEY) {
        setUser(readStoredUser())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be used inside an <AuthProvider>')
  }
  return ctx
}
