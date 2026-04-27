import { useState } from 'react'

// NBIC Bushfire Fuel Classification — class list per Area Fire Vulnerability
// spec (PO-provided model documentation). Same canonical list as SiteAssessment.
const FUEL_TYPES = [
  'Tall closed forest',
  'Closed forest',
  'Pine plantation',
  'Tall open forest',
  'Tall shrubland',
  'Open forest',
  'Woodland with shrubby understory',
  'Shrubland',
  'Low woodland',
  'Grassland',
  'Sedgeland',
  'Cropland',
  'Wetland',
  'Sparse grassland',
  'Built-up',
  'Bare ground',
  'Water',
] as const
type FuelType = typeof FUEL_TYPES[number]

const RiskMap = () => {
  const [slope, setSlope] = useState(15)
  const [fuelType, setFuelType] = useState<FuelType>('Open forest')
  // Granite Influence is binary per Area Fire Vulnerability spec
  // (inside granite-related geology polygon = 100, outside = 0).
  // Will eventually be derived from spatial overlap with the granite layer
  // rather than a manual toggle, but exposing it as a checkbox for now.
  const [granite, setGranite] = useState(false)

  return (
    <div className="flex h-full" style={{ background: '#F0EDE8' }}>
      {/* Left Panel */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col px-6 py-6 overflow-y-auto flex-shrink-0">
        
        {/* Avatar + Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tight">
            Heritage Fire<br />Vulnerability<br />Model
          </h1>
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 mb-8 bg-gray-50">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="search"
            className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400"
          />
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-8">

          {/* Topography */}
          <div>
            <p className="font-bold text-base mb-3">Topography (Slope)</p>
            <input
              type="range"
              min={0}
              max={45}
              value={slope}
              onChange={(e) => setSlope(Number(e.target.value))}
              className="w-full accent-[#8B2020] h-1 cursor-pointer"
            />
            <p className="text-right text-sm text-gray-500 mt-1">{slope}°</p>
          </div>

          {/* Vegetation */}
          <div>
            <p className="font-bold text-base mb-3">Vegetation (Fuel Type)</p>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 outline-none focus:border-gray-400 focus:bg-white transition-colors cursor-pointer"
            >
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Granite */}
          <div>
            <p className="font-bold text-base mb-3">Granite Influence</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={granite}
                onChange={(e) => setGranite(e.target.checked)}
                className="w-4 h-4 accent-[#8B2020] cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Inside granite-related geology polygon
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Geology context — useful for predicting rock art locations
            </p>
          </div>

        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#8B2020] flex-shrink-0" />
            <span className="text-sm font-medium">At Risk ( &lt;100m )</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0" />
            <span className="text-sm font-medium">Low Risk ( &gt;100m )</span>
          </div>
        </div>

      </div>

      {/* Map placeholder */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Map will be displayed here</p>
      </div>

    </div>
  )
}

export default RiskMap