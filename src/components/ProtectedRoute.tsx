// Route guard for any page that requires the user to be signed in.
//
// Wrap a route's element with <ProtectedRoute>...</ProtectedRoute> and
// it will render its children when the user has a valid token, or
// redirect to /login otherwise. `replace` is used so the redirect does
// not pile up entries in the browser history.

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Props = { children: ReactNode }

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
