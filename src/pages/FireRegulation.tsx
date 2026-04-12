const FireRegulation = () => {
    return (
      <div className="flex flex-col items-center px-12 py-10 h-full overflow-y-auto bg-white">
  
        {/* Title */}
        <h1 className="text-3xl font-black uppercase tracking-wide mb-12">
          FIRE Risk REGULATION
        </h1>
  
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
  
          {/* Buffer Bar */}
          <div className="w-16 bg-[#8B2020] flex items-center justify-center flex-shrink-0">
            <p
              className="text-white text-sm font-black tracking-widest"
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
            Heritage within 1000m of burnable vegetation are considered{' '}
            <span className="text-[#8B2020]">AT RISK.</span>
          </p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            Consult Planning guide for mitigation strategies.
          </p>
        </div>
  
        {/* Buttons */}
        <div className="flex gap-6 w-full max-w-4xl">
          <button className="flex-1 py-5 rounded-xl bg-[#2E7D32] text-white text-lg font-bold hover:bg-[#1B5E20] transition-colors">
            View Mitigation Guide
          </button>
          <button className="flex-1 py-5 rounded-xl bg-[#8B2020] text-white text-lg font-bold hover:bg-[#6B1010] transition-colors">
            Contact Local Planner
          </button>
        </div>
  
      </div>
    )
  }
  
  export default FireRegulation