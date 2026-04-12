interface Site {
    id: string
    name: string
    heritageType: string
    source: 'ACHIS' | 'Inherit' | 'Field obs.'
    slope: number
    fuelAge: number
    granite: number
    vulnerability: 'High' | 'Medium' | 'Low'
    assessedDate: string
  }
  
  const mockSites: Site[] = [
    { id: 'FRK-094', name: 'Bilya Mia Rock Shelter', heritageType: 'Rock art', source: 'ACHIS', slope: 28, fuelAge: 14, granite: 65, vulnerability: 'High', assessedDate: '2026-03-28' },
    { id: 'FRK-108', name: 'Ngaook Ochre Quarry', heritageType: 'Ochre extraction', source: 'Inherit', slope: 22, fuelAge: 11, granite: 55, vulnerability: 'High', assessedDate: '2026-03-30' },
    { id: 'FRK-113', name: 'Frankland River Timber', heritageType: 'Timber structures', source: 'Field obs.', slope: 12, fuelAge: 16, granite: 30, vulnerability: 'Medium', assessedDate: '2026-04-02' },
    { id: 'FRK-114', name: 'Wudjari Scar Tree Grove', heritageType: 'Modified trees', source: 'ACHIS', slope: 10, fuelAge: 9, granite: 20, vulnerability: 'Medium', assessedDate: '2026-04-01' },
    { id: 'FRK-115', name: 'Two Peoples Bay Stone', heritageType: 'Stone arrangement', source: 'Inherit', slope: 5, fuelAge: 3, granite: 10, vulnerability: 'Low', assessedDate: '2026-03-15' },
    { id: 'FRK-116', name: 'Manypeaks Midden Complex', heritageType: 'Earthen midden', source: 'ACHIS', slope: 4, fuelAge: 4, granite: 8, vulnerability: 'Low', assessedDate: '2026-03-20' },
  ]
  
  const vulnerabilityPill = (v: Site['vulnerability']) => {
    const styles = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-amber-100 text-amber-800',
      Low: 'bg-green-100 text-green-700',
    }
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${styles[v]}`}>
        {v}
      </span>
    )
  }
  
  const sourceBadge = (s: Site['source']) => {
    const styles = {
      'ACHIS': 'bg-indigo-50 text-indigo-700',
      'Inherit': 'bg-indigo-50 text-indigo-700',
      'Field obs.': 'bg-green-50 text-green-700',
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${styles[s]}`}>
        {s}
      </span>
    )
  }
  
  import { useState } from 'react'
  
  const HeritagRegistry = () => {
    const [search, setSearch] = useState('')
    const [vulnFilter, setVulnFilter] = useState('All')
    const [sourceFilter, setSourceFilter] = useState('All')
  
    const filtered = mockSites.filter((site) => {
      const matchSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.id.toLowerCase().includes(search.toLowerCase())
      const matchVuln = vulnFilter === 'All' || site.vulnerability === vulnFilter
      const matchSource = sourceFilter === 'All' || site.source === sourceFilter
      return matchSearch && matchVuln && matchSource
    })
  
    const total = mockSites.length
    const high = mockSites.filter((s) => s.vulnerability === 'High').length
    const medium = mockSites.filter((s) => s.vulnerability === 'Medium').length
    const low = mockSites.filter((s) => s.vulnerability === 'Low').length
  
    const exportCSV = () => {
      const headers = ['ID', 'Name', 'Heritage Type', 'Source', 'Slope', 'Fuel Age', 'Granite', 'Vulnerability', 'Assessed Date']
      const rows = mockSites.map((s) =>
        [s.id, s.name, s.heritageType, s.source, s.slope, s.fuelAge, s.granite, s.vulnerability, s.assessedDate].join(',')
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
      a.download = 'heritage_registry.csv'
      a.click()
    }
  
    return (
      <div className="px-8 py-8 min-h-full" style={{ background: '#F0EDE8' }}>
  
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-900">Heritage Registry</h1>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Site
          </button>
        </div>
  
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total sites', value: total, color: 'text-gray-900' },
            { label: 'High vulnerability', value: high, color: 'text-red-700' },
            { label: 'Medium vulnerability', value: medium, color: 'text-amber-600' },
            { label: 'Low vulnerability', value: low, color: 'text-green-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
  
        {/* Toolbar */}
        <div className="flex gap-3 mb-4 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm outline-none w-full text-gray-700 placeholder-gray-400"
            />
          </div>
          <select
            value={vulnFilter}
            onChange={(e) => setVulnFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer"
          >
            <option value="All">All vulnerability</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer"
          >
            <option value="All">All sources</option>
            <option value="ACHIS">ACHIS</option>
            <option value="Inherit">Inherit</option>
            <option value="Field obs.">Field obs.</option>
          </select>
          <button
            onClick={exportCSV}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>
  
        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Site name', 'Heritage type', 'Source', 'Slope', 'Fuel age', 'Granite', 'Vulnerability', 'Assessed', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No sites match your search
                  </td>
                </tr>
              ) : (
                filtered.map((site) => (
                  <tr key={site.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{site.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{site.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{site.heritageType}</td>
                    <td className="px-4 py-3">{sourceBadge(site.source)}</td>
                    <td className="px-4 py-3 text-gray-600">{site.slope}°</td>
                    <td className="px-4 py-3 text-gray-600">{site.fuelAge} yr</td>
                    <td className="px-4 py-3 text-gray-600">{site.granite}%</td>
                    <td className="px-4 py-3">{vulnerabilityPill(site.vulnerability)}</td>
                    <td className="px-4 py-3 text-gray-400">{site.assessedDate}</td>
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
  
      </div>
    )
  }
  
  export default HeritagRegistry