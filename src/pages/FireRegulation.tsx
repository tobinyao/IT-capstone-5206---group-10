import { Link } from 'react-router-dom'

const FireRegulation = () => {
    return (
      <div className="flex flex-col items-center px-12 py-10 h-full overflow-y-auto" style={{ background: '#F0EDE8' }}>
  
        {/* Title */}
        <h1 className="text-3xl font-black uppercase tracking-wide mb-2">
          FIRE Risk REGULATION
        </h1>

        {/* Subtitle */}
        <p className="text-base font-medium text-gray-700 italic mb-10 text-center">
          Risk increases sharply within 100m of burnable vegetation
        </p>

        {/* Buffer Diagram */}
        <div className="flex items-stretch w-full max-w-4xl mb-10 rounded-2xl overflow-hidden min-h-[320px]">

          {/* Vegetation Panel */}
          <div className="flex-1 flex flex-col items-center justify-center py-10"
            style={{ background: 'linear-gradient(135deg, #d4edda, #a8d5b5)' }}>
            {/* Tree SVG */}
            <svg width="120" height="130" viewBox="0 0 120 130" fill="none">
              <ellipse cx="60" cy="62" rx="48" ry="42" fill="#2E7D32"/>
              <ellipse cx="60" cy="55" rx="38" ry="32" fill="#388E3C"/>
              <rect x="51" y="96" width="18" height="28" rx="4" fill="#E65100"/>
            </svg>
            <p className="text-lg font-bold mt-4 text-gray-800">Vegetation</p>
          </div>

          {/* Inner High-Risk Band — 100m */}
          <div className="w-12 bg-[#8B2020] flex items-center justify-center flex-shrink-0">
            <p
              className="text-white text-xs font-black tracking-widest whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              100m Great Risk
            </p>
          </div>

          {/* Outer Buffer Band — 1000m */}
          <div className="w-20 bg-[#D97706] flex items-center justify-center flex-shrink-0">
            <p
              className="text-white text-sm font-black tracking-widest whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              1000m Buffer
            </p>
          </div>

          {/* Heritage Panel */}
          <div className="flex-1 flex flex-col items-center justify-center py-10 bg-gray-300 rounded-r-2xl">
            {/* Building SVG */}
            <svg width="120" height="130" viewBox="0 0 120 130" fill="none">
              <rect x="10" y="100" width="100" height="7" fill="#555"/>
              {/* Left building */}
              <rect x="18" y="45" width="32" height="62" fill="#9E9E9E" stroke="#555" strokeWidth="2"/>
              <polygon points="18,45 34,10 50,45" fill="#1565C0" stroke="#1565C0" strokeWidth="1"/>
              {/* Right building */}
              <rect x="58" y="30" width="42" height="77" fill="#BDBDBD" stroke="#888" strokeWidth="2"/>
              <polygon points="60,30 79,5 100,30" fill="#1976D2" stroke="#1976D2" strokeWidth="1"/>
            </svg>
            <p className="text-lg font-bold mt-4 text-gray-800">Heritage</p>
          </div>
  
        </div>
  
        {/* Rule Text */}
        <div className="text-center mb-10">
          <p className="text-lg font-bold text-gray-900">
            Heritage within <span className="text-[#8B2020]">100m</span> of burnable vegetation are at{' '}
            <span className="text-[#8B2020]">GREAT RISK.</span>
          </p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            Heritage within <span className="text-[#D97706]">1000m</span> falls within the{' '}
            <span className="text-[#D97706]">planning buffer zone</span> — review and prepare.
          </p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            Consult Planning guide for mitigation strategies.
          </p>
        </div>
  
        {/* Buttons */}
        <div className="flex gap-6 w-full max-w-4xl">
          <Link
            to="/mitigation-guide"
            className="flex-1 py-5 rounded-xl bg-[#2E7D32] text-white text-lg font-bold hover:bg-[#1B5E20] transition-colors text-center"
          >
            View Mitigation Guide
          </Link>
          <Link
            to="/contacts"
            className="flex-1 py-5 rounded-xl bg-[#8B2020] text-white text-lg font-bold hover:bg-[#6B1010] transition-colors text-center"
          >
            Contact Local Planner
          </Link>
        </div>
  
      </div>
    )
  }
  
  export default FireRegulation