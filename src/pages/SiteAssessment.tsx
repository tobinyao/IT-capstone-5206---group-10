import { useState } from 'react'

type HeritageType =
  | 'Rock art / petroglyphs'
  | 'Ochre extraction site'
  | 'Culturally modified trees'
  | 'Timber structures'
  | 'Artefact scatter'
  | 'Earthen mound / midden'
  | 'Stone arrangement'

type Source = 'ACHIS' | 'Inherit' | 'Field observation'
type Vulnerability = 'High' | 'Medium' | 'Low'

interface Action {
  text: string
  priority: 'Urgent' | 'High priority' | 'Standard'
  color: string
}

const getVulnerability = (score: number): Vulnerability => {
  if (score >= 60) return 'High'
  if (score >= 35) return 'Medium'
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
  const [heritageType, setHeritageType] = useState<HeritageType>('Rock art / petroglyphs')
  const [source, setSource] = useState<Source>('ACHIS')
  const [slope, setSlope] = useState(28)
  const [fuelAge, setFuelAge] = useState(14)
  const [granite, setGranite] = useState(65)
  const [wind, setWind] = useState(4)

  const slopeScore = Math.round((slope / 45) * 100)
  const fuelScore = Math.round((fuelAge / 30) * 100)
  const graniteScore = granite
  const windScore = Math.round((wind / 5) * 100)
  const totalScore = Math.round(slopeScore * 0.3 + fuelScore * 0.25 + graniteScore * 0.25 + windScore * 0.2)

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
      ['Fuel Age', `${fuelAge} yrs`],
      ['Granite Index', `${granite}%`],
      ['Wind Exposure', `${wind}/5`],
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
                  <option>Rock art / petroglyphs</option>
                  <option>Ochre extraction site</option>
                  <option>Culturally modified trees</option>
                  <option>Timber structures</option>
                  <option>Artefact scatter</option>
                  <option>Earthen mound / midden</option>
                  <option>Stone arrangement</option>
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
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{slope}°</span>
                </div>
                <input type="range" min={0} max={45} value={slope} step={1}
                  onChange={(e) => setSlope(Number(e.target.value))}
                  className="w-full accent-[#8B2020] h-1 cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>0°</span><span>45°</span></div>
              </div>

              {/* Fuel Age */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Vegetation (Fuel Age)</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{fuelAge} yrs</span>
                </div>
                <input type="range" min={0} max={30} value={fuelAge} step={1}
                  onChange={(e) => setFuelAge(Number(e.target.value))}
                  className="w-full accent-[#8B2020] h-1 cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>0 yrs</span><span>30 yrs</span></div>
              </div>

              {/* Granite */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Granite (Outcrop Index)</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{granite}%</span>
                </div>
                <input type="range" min={0} max={100} value={granite} step={1}
                  onChange={(e) => setGranite(Number(e.target.value))}
                  className="w-full accent-[#8B2020] h-1 cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>0%</span><span>100%</span></div>
              </div>

              {/* Wind */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Wind Exposure</span>
                  <span className="text-xs font-extrabold text-[#8B2020] bg-red-50 px-2 py-0.5 rounded-md">{wind} / 5</span>
                </div>
                <input type="range" min={1} max={5} value={wind} step={1}
                  onChange={(e) => setWind(Number(e.target.value))}
                  className="w-full accent-[#8B2020] h-1 cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-300 mt-1"><span>Sheltered</span><span>Exposed</span></div>
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
                { label: 'Slope', val: slopeScore },
                { label: 'Fuel age', val: fuelScore },
                { label: 'Granite', val: graniteScore },
                { label: 'Wind', val: windScore },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{f.label}</span>
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