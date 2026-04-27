import { useState } from 'react'

// Heritage Type / Material Risk categories per Heritage Vulnerability Score spec
// (PO-provided model documentation, see team channel).
type HeritageType =
  | 'Modified tree / timber / wooden structure'
  | 'Rock art / painting / engraving / rock shelter'
  | 'Burial / grave / cemetery'
  | 'Ceremonial / creation / dreaming / mythological place'
  | 'General built heritage'
  | 'Midden / organic deposit'
  | 'Camp / historical place / water source'
  | 'Artefact scatter / quarry / grinding area / sub-surface material'
  | 'Brick / stone / masonry / concrete'

type Source = 'ACHIS' | 'Inherit' | 'Field observation'
type Vulnerability = 'High' | 'Medium' | 'Low'

// NBIC Bushfire Fuel Classification — class list and per-class fuel risk score
// per Heritage Vulnerability Score spec (PO-provided model documentation).
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

const FUEL_TYPE_SCORE: Record<FuelType, number> = {
  'Tall closed forest': 100,
  'Closed forest': 96,
  'Pine plantation': 94,
  'Tall open forest': 92,
  'Tall shrubland': 88,
  'Open forest': 86,
  'Woodland with shrubby understory': 84,
  'Shrubland': 82,
  // TODO(PO): spec lists "Low woodland: 56–78" as a range; using midpoint 67
  // pending confirmation whether this band should be subdivided.
  'Low woodland': 67,
  'Grassland': 62,
  'Sedgeland': 58,
  'Cropland': 50,
  'Wetland': 35,
  'Sparse grassland': 34,
  'Built-up': 26,
  'Bare ground': 12,
  'Water': 5,
}

// Heritage Type / Material Risk per Heritage Vulnerability Score spec.
const HERITAGE_TYPE_SCORE: Record<HeritageType, number> = {
  'Modified tree / timber / wooden structure': 95,
  'Rock art / painting / engraving / rock shelter': 86,
  'Burial / grave / cemetery': 76,
  'Ceremonial / creation / dreaming / mythological place': 72,
  'General built heritage': 72,
  'Midden / organic deposit': 62,
  'Camp / historical place / water source': 60,
  'Artefact scatter / quarry / grinding area / sub-surface material': 52,
  'Brick / stone / masonry / concrete': 46,
}

// Slope Risk per Heritage Vulnerability Score spec.
// Note: 15–25° band coefficient is 5.0 (not 3.5 from the original spec doc).
// PO confirmed the smooth-transition variant so slope = 25° reaches 100 cleanly
// instead of jumping from 85 to 100 just above 25°.
const slopeRisk = (slope: number): number => {
  if (slope <= 5) return 12
  if (slope <= 15) return 12 + (slope - 5) * 3.8
  if (slope <= 25) return 50 + (slope - 15) * 5.0
  return 100
}

type SlopeLevel = 'Low' | 'Moderate' | 'Steep' | 'Very steep'
const slopeLevel = (slope: number): SlopeLevel => {
  if (slope <= 5) return 'Low'
  if (slope <= 15) return 'Moderate'
  if (slope <= 25) return 'Steep'
  return 'Very steep'
}

interface Action {
  text: string
  priority: 'Urgent' | 'High priority' | 'Standard'
  color: string
}

// Vulnerability level thresholds per spec (calibrated within the FRK study area;
// High represents top ~5% of scores).
const getVulnerability = (score: number): Vulnerability => {
  if (score >= 64.2) return 'High'
  if (score >= 48.3) return 'Medium'
  return 'Low'
}

const getCircleStyle = (v: Vulnerability) => {
  if (v === 'High') return { bg: 'bg-[#8B2020]', ring: 'ring-[#8B2020]/20', text: 'text-white' }
  if (v === 'Medium') return { bg: 'bg-amber-600', ring: 'ring-amber-600/20', text: 'text-white' }
  return { bg: 'bg-green-700', ring: 'ring-green-700/20', text: 'text-white' }
}

const getActions = (v: Vulnerability): Action[] => {
  if (v === 'High') return [
    { text: 'Emergency documentation of all site surfaces immediately', priority: 'Urgent', color: '#C0392B' },
    { text: 'Notify Traditional Owners and heritage authority', priority: 'Urgent', color: '#C0392B' },
    { text: 'Request heritage exclusion zone from fire officer', priority: 'High priority', color: '#D97706' },
    { text: 'Coordinate prescribed burn with cultural custodians', priority: 'High priority', color: '#D97706' },
    { text: 'Update site record in Heritage Registry', priority: 'Standard', color: '#16A34A' },
  ]
  if (v === 'Medium') return [
    { text: 'Schedule site inspection within 4 weeks', priority: 'High priority', color: '#D97706' },
    { text: 'Consult Traditional Owners on seasonal fire risk', priority: 'High priority', color: '#D97706' },
    { text: 'Review fuel management plan for surrounding land', priority: 'Standard', color: '#16A34A' },
    { text: 'Update site record in Heritage Registry', priority: 'Standard', color: '#16A34A' },
  ]
  return [
    { text: 'Maintain routine 6-monthly monitoring schedule', priority: 'Standard', color: '#16A34A' },
    { text: 'Engage Traditional Owners in seasonal planning', priority: 'Standard', color: '#16A34A' },
    { text: 'Update site record in Heritage Registry', priority: 'Standard', color: '#16A34A' },
  ]
}

const getFactorColor = (val: number) => {
  if (val >= 60) return '#C0392B'
  if (val >= 35) return '#D97706'
  return '#16A34A'
}

const SiteAssessment = () => {
  const [siteName, setSiteName] = useState('')
  const [siteId, setSiteId] = useState('')
  const [heritageType, setHeritageType] = useState<HeritageType>('Rock art / painting / engraving / rock shelter')
  const [source, setSource] = useState<Source>('ACHIS')
  const [slope, setSlope] = useState(28)
  const [fuelType, setFuelType] = useState<FuelType>('Open forest')
  const [burnContext, setBurnContext] = useState(false)

  const slopeScore = slopeRisk(slope)
  const fuelScore = FUEL_TYPE_SCORE[fuelType]
  const heritageTypeScore = HERITAGE_TYPE_SCORE[heritageType]
  const burnContextScore = burnContext ? 100 : 0

  // Heritage Vulnerability Score formula per PO spec.
  const totalScore = Math.round(
    fuelScore * 0.45 +
    slopeScore * 0.25 +
    heritageTypeScore * 0.25 +
    burnContextScore * 0.05
  )

  const vulnerability = getVulnerability(totalScore)
  const circleStyle = getCircleStyle(vulnerability)
  const actions = getActions(vulnerability)

  const exportCSV = () => {
    const rows = [
      ['Field', 'Value'],
      ['Site Name', siteName || 'N/A'],
      ['Site ID', siteId || 'N/A'],
      ['Heritage Type', heritageType],
      ['Source', source],
      ['Slope', `${slope}°`],
      ['Fuel Type', fuelType],
      ['Burn Context', burnContext ? 'Inside DBCA proposed prescribed burn area' : 'Outside'],
      ['Vulnerability Score', totalScore],
      ['Vulnerability Level', vulnerability],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `assessment_${siteId || 'site'}.csv`
    a.click()
  }

  return (
    <div className="px-8 py-8 min-h-full" style={{ background: '#F0EDE8' }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Site Assessment</h1>
        <p className="text-sm text-gray-400 mt-1">Evaluate fire vulnerability for a heritage site</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* Site Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-300 mb-5">Site information</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Site name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Site ID</label>
                <input
                  type="text"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="e.g. FRK-094"
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Heritage type</label>
                <select
                  value={heritageType}
                  onChange={(e) => setHeritageType(e.target.value as HeritageType)}
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                >
                  <option>Modified tree / timber / wooden structure</option>
                  <option>Rock art / painting / engraving / rock shelter</option>
                  <option>Burial / grave / cemetery</option>
                  <option>Ceremonial / creation / dreaming / mythological place</option>
                  <option>General built heritage</option>
                  <option>Midden / organic deposit</option>
                  <option>Camp / historical place / water source</option>
                  <option>Artefact scatter / quarry / grinding area / sub-surface material</option>
                  <option>Brick / stone / masonry / concrete</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Data source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as Source)}
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                >
                  <option>ACHIS</option>
                  <option>Inherit</option>
                  <option>Field observation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Environmental Factors */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-300 mb-5">Environmental factors</div>
            <div className="flex flex-col gap-5">

              {/* Slope */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Topography (Slope)</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{slope}° · {slopeLevel(slope)}</span>
                </div>
                <input type="range" min={0} max={45} value={slope} step={1}
                  onChange={(e) => setSlope(Number(e.target.value))}
                  className="w-full accent-[#8B2020] h-1 cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>0°</span><span>45°</span></div>
              </div>

              {/* Fuel Type */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Vegetation (Fuel Type)</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{fuelType}</span>
                </div>
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

              {/* Burn Context */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Burn Context</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">
                    {burnContext ? 'Inside' : 'Outside'}
                  </span>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={burnContext}
                    onChange={(e) => setBurnContext(e.target.checked)}
                    className="w-4 h-4 accent-[#8B2020] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    Inside DBCA proposed prescribed burn area
                  </span>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* Result Card — dark */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-600 mb-5">Vulnerability result</div>

            <div className="flex items-center gap-5 mb-6">
              <div className={`w-24 h-24 rounded-full ${circleStyle.bg} ring-8 ${circleStyle.ring} flex flex-col items-center justify-center flex-shrink-0`}>
                <div className="text-3xl font-black text-white leading-none">{totalScore}</div>
                <div className="text-xs text-white/60 font-bold mt-1">/ 100</div>
              </div>
              <div>
                <div className="text-xl font-black text-white mb-1">{vulnerability} Risk</div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  {vulnerability === 'High' && 'Immediate action required. Emergency documentation needed before fire season.'}
                  {vulnerability === 'Medium' && 'Monitor closely. Schedule inspection and consult Traditional Owners.'}
                  {vulnerability === 'Low' && 'Routine monitoring sufficient. Include in annual planning cycle.'}
                </div>
              </div>
            </div>

            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-600 mb-3">Contributing factors</div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Fuel Type', val: fuelScore },
                { label: 'Slope', val: slopeScore },
                { label: 'Heritage Type', val: heritageTypeScore },
                { label: 'Burn Context', val: burnContextScore },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${f.val}%`, background: getFactorColor(f.val) }} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-6 text-right">{f.val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert(`Saved: ${siteName || 'Site'} — ${vulnerability} Risk`)}
              className="w-full mt-6 py-3 rounded-xl bg-[#8B2020] text-white text-sm font-black hover:bg-[#6B1010] transition-colors"
            >
              Save to Registry
            </button>
            <button
              onClick={exportCSV}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#2A2A2A] text-gray-500 text-sm font-semibold hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-300 mb-4">Recommended actions</div>
            <div className="flex flex-col">
              {actions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-none last:pb-0 first:pt-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: action.color }} />
                  <div>
                    <div className="text-sm text-gray-700 leading-snug">{action.text}</div>
                    <div className="text-xs font-bold mt-1" style={{ color: action.color }}>{action.priority}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SiteAssessment