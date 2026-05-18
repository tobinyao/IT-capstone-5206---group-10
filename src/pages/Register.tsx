import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { register as registerRequest } from '../api/auth'

const AUSTRALIA_CENTER: [number, number] = [-25, 134]
const FRK_LATLNG: [number, number] = [-34.4, 117.8]

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await registerRequest(email, password)
      setSuccess('Account created successfully. Redirecting to login...')

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 min-h-screen">

      {/* LEFT — branding */}
      <div className="bg-[#1A1A1A] px-12 py-12 flex flex-col justify-between">
        <div>
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
              {/* Brand wordmark on the register hero panel. "Heritage"
                  was added per client feedback to align with the
                  sidebar branding across the app. */}
              <div className="text-xs font-extrabold text-white uppercase tracking-widest leading-tight">
                Heritage Fire<br />Vulnerability<br />Assessment Tool
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Franklin District · WA</div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            Join the<br />
            <span className="text-[#8B2020]">Fire Vulnerability</span><br />
            Assessment Platform
          </h1>

          <p className="text-sm text-gray-500 leading-relaxed">
            Create an authorised account to access heritage fire vulnerability tools,
            site assessment workflows, and risk map features.
          </p>

          <div className="flex flex-col gap-3 mt-10">
            {[
              'Secure access for authorised project users',
              'Heritage site registry — ACHIS & Inherit',
              'Franklin District (FRK) · Western Australia',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#8B2020] flex-shrink-0" />
                <span className="text-xs text-gray-500">{item}</span>
              </div>
            ))}
          </div>

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

          <div className="text-[11px] text-gray-500 leading-relaxed mb-4">
            <p>Developed with Wagyl Kaip and The University of Western Australia.</p>
            <p>This tool respects ICIP and IDaS principles.</p>
            <p>For authorised research/project use only. Do not misuse, redistribute, or expose sensitive heritage data.</p>
          </div>

          <div className="text-xs text-gray-700">
            {/* Footer copyright line — keep brand string in sync with sidebar/title. */}
            © 2026 Heritage Fire Vulnerability Assessment Tool · Franklin District
          </div>
        </div>
      </div>

      {/* RIGHT — register form */}
      <div className="flex items-center justify-center px-12 py-12" style={{ background: '#F0EDE8' }}>
        <div className="bg-white rounded-2xl border border-gray-100 p-9 w-full max-w-sm">
          <h2 className="text-xl font-black text-gray-900 mb-1">Create account</h2>
          <p className="text-sm text-gray-400 mb-7">Register to access the assessment platform</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="register-email" className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
                Email address
              </label>
              <input
                id="register-email"
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

            <div className="mb-4">
              <label htmlFor="register-password" className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors disabled:opacity-60"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="register-confirm-password" className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
                Confirm password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-xs text-green-700"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-black hover:bg-gray-800 transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-semibold">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-xs text-gray-400 leading-relaxed">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-gray-700 hover:text-gray-900">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-300 mt-6 leading-relaxed">
            Registration is intended for authorised project users only.<br />
            Contact your administrator if you need access approval.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Register