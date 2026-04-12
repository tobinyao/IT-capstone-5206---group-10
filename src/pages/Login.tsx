const Login = () => {
  return (
    <div className="grid grid-cols-2 min-h-screen">

      {/* LEFT — branding */}
      <div className="bg-[#1A1A1A] px-12 py-12 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-[#8B2020] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                <path d="M10 0C10 0 4 5 3 10C2 13 3 15 4 16C4 13 6 11 6 11C6 14 7 16 9 17C8 15 9 13 10 12C11 13 12 15 11 17C13 16 14 14 14 11C14 11 16 13 16 16C17 15 18 13 17 10C16 5 10 0 10 0Z" fill="white"/>
                <path d="M10 22C12.2 22 14 20.2 14 18C14 15.8 10 13 10 13C10 13 6 15.8 6 18C6 20.2 7.8 22 10 22Z" fill="white" opacity=".7"/>
              </svg>
            </div>
            <div className="text-xs font-extrabold text-white uppercase tracking-widest leading-tight">
              Fire Vulnerability<br />Assessment Tool
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
              'Predictive fire vulnerability modelling',
              'Heritage site registry — ACHIS & Inherit',
              'Franklin District (FRK) · Western Australia',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#8B2020] flex-shrink-0" />
                <span className="text-xs text-gray-500">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-700">
          © 2026 Fire Vulnerability Assessment Tool · Franklin District
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex items-center justify-center px-12 py-12" style={{ background: '#F0EDE8' }}>
        <div className="bg-white rounded-2xl border border-gray-100 p-9 w-full max-w-sm">
          <h2 className="text-xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-7">Sign in to your account to continue</p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@dpird.wa.gov.au"
              className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
            />
          </div>

          {/* Forgot */}
          <div className="text-right mb-6">
            <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              Forgot password?
            </span>
          </div>

          {/* Sign in btn */}
          <button className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-black hover:bg-gray-800 transition-colors mb-3">
            Sign in
          </button>

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
            Access is restricted to authorised personnel.<br />
            Contact your administrator for access.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Login