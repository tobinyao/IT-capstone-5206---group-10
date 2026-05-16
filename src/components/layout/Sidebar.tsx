import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthUser } from '../../api/auth'

// Pick the most user-friendly label available for the signed-in user,
// preferring display name, then email, then a generic fallback.
function getDisplayName(user: AuthUser | null): string {
  return user?.name || user?.email || 'Guest'
}

// Show the user's role when the backend supplied one, otherwise a
// neutral label so the card always has two lines of text.
function getRoleLabel(user: AuthUser | null): string {
  if (user?.role) return user.role
  return user ? 'Authenticated user' : 'Not signed in'
}

// Two-letter avatar initials. Prefer initials of the first two words
// of the display name, otherwise the first two characters.
function getInitials(user: AuthUser | null): string {
  const source = (user?.name || user?.email || 'G').trim()
  const parts = source.split(/\s+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase() || 'G'
}

// Local Contacts is intentionally not surfaced in the sidebar. It is
// reached only from the Fire Risk Regulation page via the "Contact
// Local Planner" call-to-action, so the entry point stays contextual
// to the regulation workflow.
const navItems = [
  { section: 'Assessment', links: [
    { to: '/', label: 'Risk Map' },
    { to: '/insights', label: 'Model Insights' },
    { to: '/regulation', label: 'Fire Risk Regulation' },
  ]},
  { section: 'Data', links: [
    { to: '/registry', label: 'Heritage Registry' },
    { to: '/assessment', label: 'Site Assessment' },
  ]},
]

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = getDisplayName(user)
  const roleLabel = getRoleLabel(user)
  const initials = getInitials(user)

  const handleLogout = () => {
    // Clear React state + localStorage, then send the user back to
    // /login. `replace` so the protected page is not left in history.
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-56 bg-[#1A1A1A] text-white flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2A2A2A]">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#B03A2E] flex items-center justify-center shadow-sm shadow-black/20 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-8 h-8" aria-hidden="true">
              <path
                d="M32 8c7 9 16 15 16 28 0 10-7 18-16 18s-16-8-16-18c0-8 4-14 10-20 1 6 4 9 8 11-1-7 1-13 8-19Z"
                fill="#F7F7F4"
              />
              <path
                d="M32 28c4 5 8 8 8 14 0 5-4 9-8 9s-8-4-8-9c0-4 2-7 5-10 0 3 1 4 3 5 0-3 1-6 4-9Z"
                fill="#1A1A1A"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-widest uppercase leading-tight">
              Fire Vulnerability<br />Assessment Tool
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Franklin District · WA</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="px-4 pt-4 pb-1 text-[9px] font-bold tracking-widest text-gray-600 uppercase">
              {group.section}
            </div>
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-[13px] font-medium border-l-[3px] transition-colors ${
                    isActive
                      ? 'bg-[#333] text-white border-[#B03A2E]'
                      : 'text-gray-400 border-transparent hover:bg-[#2A2A2A] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2A2A2A]">
        {/* Account — signed-in user info + logout. Sits above Project
            Partners so the most actionable footer item is closest to the
            user's eye. Falls back to a "Guest" card if no user is in
            context (ProtectedRoute should normally prevent this). */}
        <div className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">
          Account
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-2 rounded-md border border-[#2A2A2A] bg-[#202020] px-2 py-2">
            <div
              className="w-7 h-7 rounded-full bg-[#B03A2E] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-white leading-tight truncate" title={displayName}>
                {displayName}
              </div>
              <div className="text-[10px] text-gray-500 leading-tight truncate" title={roleLabel}>
                {roleLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 mt-2 px-2 py-2 rounded-md border border-[#2A2A2A] bg-[#202020] text-[11px] font-semibold text-gray-300 hover:bg-[#2A2A2A] hover:text-white hover:border-[#B03A2E] transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>

        <div className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">
          Project Partners
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 rounded-md border border-[#2A2A2A] bg-[#202020] px-2 py-2">
            <img
              src="https://images.squarespace-cdn.com/content/v1/61f8e2c584741255f5ca8798/290d1715-85eb-4c72-a7e6-9c59ca2501ca/WKSNLogo.png"
              alt="Wagyl Kaip South Noongar logo"
              className="w-7 h-7 rounded object-contain bg-white p-0.5 flex-shrink-0"
            />
            <div>
              <div className="text-[11px] font-semibold text-white leading-tight">Wagyl Kaip</div>
              <div className="text-[10px] text-gray-500 leading-tight">Project Partner</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[#2A2A2A] bg-[#202020] px-2 py-2">
            <img
              src="https://www.uwa.edu.au/_assets/favicon512.png"
              alt="University of Western Australia logo"
              className="w-7 h-7 rounded object-contain bg-white p-0.5 flex-shrink-0"
            />
            <div>
              <div className="text-[11px] font-semibold text-white leading-tight">University of Western Australia</div>
              <div className="text-[10px] text-gray-500 leading-tight">Project Partner</div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-gray-600">
          Franklin District · FRK<br />v1.0 Pilot
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
