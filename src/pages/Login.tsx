import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useAuth } from '../contexts/AuthContext'

// Approx. centre of Australia (used to frame the continent in the small map)
const AUSTRALIA_CENTER: [number, number] = [-25, 134]
// Franklin District (FRK) — approx. Mt Barker / Albany area, Western Australia
const FRK_LATLNG: [number, number] = [-34.4, 117.8]

const Login = () => {
  // Controlled form state. Email/password are bound to the inputs;
  // error holds the message rendered above the submit button; loading
  // disables the form while a sign-in request is in flight.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Delegates to AuthContext, which calls POST /api/login, then
      // persists the returned token + user to state and localStorage.
      await login(email, password)
      // Redirect to the main app on success. `replace` so the login
      // page is not left in the history stack behind the user.
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 min-h-screen">

      {/* LEFT — branding */}
      <div className="bg-[#1A1A1A] px-12 py-12 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <div className="flex items-start gap-3 mb-12">
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
              <div className="text-xs font-extrabold text-white uppercase tracking-widest leading-tight">
                Fire Vulnerability<br />Assessment Tool
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Franklin District · WA</div>
            </div>
          </div>

          {/* Hero */}
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Protecting<br />
            <span className="text-[#8B2020]">Aboriginal Heritage</span><br />
            from Fire Risk
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            A web-based tool for land managers, indigenous rangers,
            and heritage practitioners in the Franklin District, Western Australia.
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-3 mt-10">
            {[
              'Heritage Fire Vulnerability Model',
              'Heritage site registry — ACHIS & Inherit',
              'Franklin District (FRK) · Western Australia',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#8B2020] flex-shrink-0" />
                <span className="text-xs text-gray-500">{item}</span>
              </div>
            ))}
          </div>

          {/* FRK Location Map — display-only mini map showing where the
              Franklin District sits within Australia. All interactions are
              disabled so users can read the location at a glance without
              accidentally panning/zooming. */}
          <div
            className="mt-8 rounded-md overflow-hidden border border-[#2A2A2A]"
            style={{ height: 200 }}
          >
            <MapContainer
              center={AUSTRALIA_CENTER}
              zoom={3}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              zoomControl={false}
              attributionControl={false}
              style={{ height: '100%', width: '100%', background: '#202020' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {/* Red marker for Franklin District. CircleMarker avoids the
                  Vite/Leaflet default-icon asset issue and matches the
                  app's accent colour. */}
              <CircleMarker
                center={FRK_LATLNG}
                radius={6}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#B03A2E',
                  fillOpacity: 1,
                }}
              >
                <Tooltip permanent direction="bottom" offset={[0, 6]}>
                  FRK
                </Tooltip>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>

        <div>
          {/* Project Partners */}
          <div className="mb-6">
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">
              Project Partners
            </div>
            <div className="space-y-2">
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
          </div>

          {/* ICIP / IDaS / Ownership and Conditions Statement.
              Communicates project ownership, the cultural data principles
              the tool follows, and the conditions of use. Logos are not
              repeated here because they already appear in the Project
              Partners cards above. */}
          <div className="text-[11px] text-gray-500 leading-relaxed mb-4">
            <p>Developed with Wagyl Kaip and The University of Western Australia.</p>
            <p>This tool respects ICIP and IDaS principles.</p>
            <p>For authorised research/project use only. Do not misuse, redistribute, or expose sensitive heritage data.</p>
          </div>

          <div className="text-xs text-gray-700">
            © 2026 Fire Vulnerability Assessment Tool · Franklin District
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex items-center justify-center px-12 py-12" style={{ background: '#F0EDE8' }}>
        <div className="bg-white rounded-2xl border border-gray-100 p-9 w-full max-w-sm">
          <h2 className="text-xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-7">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dpird.wa.gov.au"
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label htmlFor="login-password" className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password help */}
            <div className="text-right mb-6">
              <span className="text-xs text-gray-400">
                Contact administrator to reset password
              </span>
            </div>

            {/* Inline error message returned from the sign-in attempt. */}
            {error && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            {/* Sign in btn */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-black hover:bg-gray-800 transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-semibold">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Microsoft btn */}
          <button className="w-full py-3 rounded-xl text-sm font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors" style={{ background: '#F0EDE8' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#4A90D9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#4A90D9" opacity=".6"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#4A90D9" opacity=".6"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#4A90D9"/>
            </svg>
            Sign in with Microsoft
          </button>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-300 mt-6 leading-relaxed">
            Access is restricted to authorised internal personnel.<br />
            Accounts are created by the project administrator.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Login