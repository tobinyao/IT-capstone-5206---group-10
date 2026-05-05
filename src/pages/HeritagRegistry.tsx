import { useEffect, useMemo, useState } from 'react'
import AddSiteModal from '../components/AddSiteModal'

type RiskLevel = 'High' | 'Medium' | 'Low'

type HeritageFeature = {
  properties: Record<string, unknown>
}

type HeritageFeatureCollection = {
  features: HeritageFeature[]
}

type RegistrySite = {
  id: string
  name: string
  heritageType: string
  heritageKind: string
  slope: number | null
  fuelType: string
  burnContext: string
  vulnerability: RiskLevel
  score: number | null
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'
const HERITAGE_DATA_URL = `${API_BASE}/api/layers/heritage`

const HERITAGE_CSV_FIELDS = [
  ['Identifier', 'identifier'],
  ['Name', 'name'],
  ['Heritage Kind', 'heritage_kind'],
  ['Status', 'place_status'],
  ['Place Type', 'place_type'],
  ['Region', 'region'],
  ['Source', 'source'],
  ['Fuel Class', 'fuel_class'],
  ['Fuel Risk', 'fuel_risk'],
  ['Slope Degrees', 'slope_degrees'],
  ['Slope Risk', 'slope_risk'],
  ['Heritage Type Risk Label', 'heritage_type_risk_label'],
  ['Heritage Type Risk', 'heritage_type_risk'],
  ['Burn Management Context', 'burn_management_context'],
  ['Vulnerability Score', 'vulnerability_score'],
  ['Vulnerability Level', 'vulnerability_level'],
] as const

const csvValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

const heritageGeoJsonToCsv = (data: HeritageFeatureCollection) => {
  const headers = HERITAGE_CSV_FIELDS.map(([label]) => label).join(',')
  const rows = data.features.map((feature) =>
    HERITAGE_CSV_FIELDS.map(([, key]) => csvValue(feature.properties[key])).join(',')
  )
  return [headers, ...rows].join('\n')
}

const textValue = (value: unknown, fallback = 'Unknown') => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const normalizedTextValue = (value: unknown, fallback = 'Unknown') => textValue(value, fallback).trim()

const numberValue = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const riskValue = (value: unknown): RiskLevel => {
  if (value === 'High' || value === 'Medium' || value === 'Low') return value
  return 'Low'
}

const featureToSite = (feature: HeritageFeature): RegistrySite => {
  const properties = feature.properties
  return {
    id: textValue(properties.identifier ?? properties.id, 'Unknown ID'),
    name: textValue(properties.name, 'Unnamed heritage place'),
    heritageType: textValue(properties.place_type ?? properties.heritage_type_risk_label),
    heritageKind: normalizedTextValue(properties.heritage_kind),
    slope: numberValue(properties.slope_degrees),
    fuelType: textValue(properties.fuel_class),
    burnContext: textValue(properties.burn_management_context),
    vulnerability: riskValue(properties.vulnerability_level),
    score: numberValue(properties.vulnerability_score),
  }
}

const vulnerabilityPill = (v: RiskLevel) => {
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

const heritageKindBadge = (heritageKind: string) => {
  const style = heritageKind === 'Aboriginal'
    ? 'bg-indigo-50 text-indigo-700'
    : 'bg-green-50 text-green-700'

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style}`}>
      {heritageKind}
    </span>
  )
}

const HeritagRegistry = () => {
  const [search, setSearch] = useState('')
  const [vulnFilter, setVulnFilter] = useState('All')
  const [heritageKindFilter, setHeritageKindFilter] = useState('All')
  const [heritageData, setHeritageData] = useState<HeritageFeatureCollection | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false)
  const [addSiteNotice, setAddSiteNotice] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadHeritageData() {
      try {
        const response = await fetch(HERITAGE_DATA_URL)
        if (!response.ok) {
          throw new Error('Could not load heritage registry data.')
        }
        const data = await response.json() as HeritageFeatureCollection
        if (active) setHeritageData(data)
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Could not load heritage registry data.')
        }
      }
    }

    loadHeritageData()

    return () => {
      active = false
    }
  }, [])

  const sites = useMemo(
    () => heritageData?.features.map(featureToSite) ?? [],
    [heritageData]
  )

  const heritageKindOptions = useMemo(
    () => Array.from(new Set(sites.map((site) => site.heritageKind))).sort(),
    [sites]
  )

  // TODO: replace with a dedicated backend enum endpoint once available.
  // For now, derive Add Site dropdown options from the loaded heritage data
  // (distinct values, excluding empty strings and the "Unknown" fallback
  // produced by featureToSite for missing fields).
  const distinctOptions = (values: string[]) => {
    const cleaned = values
      .map((value) => value.trim())
      .filter((value) => value !== '' && value !== 'Unknown')
    return Array.from(new Set(cleaned)).sort()
  }

  const heritageTypeOptions = useMemo(
    () => distinctOptions(sites.map((site) => site.heritageType)),
    [sites]
  )
  const fuelTypeOptions = useMemo(
    () => distinctOptions(sites.map((site) => site.fuelType)),
    [sites]
  )
  const burnContextOptions = useMemo(
    () => distinctOptions(sites.map((site) => site.burnContext)),
    [sites]
  )

  const filtered = sites.filter((site) => {
    const query = search.toLowerCase()
    const matchSearch =
      site.name.toLowerCase().includes(query) ||
      site.id.toLowerCase().includes(query) ||
      site.heritageType.toLowerCase().includes(query)
    const matchVuln = vulnFilter === 'All' || site.vulnerability === vulnFilter
    const matchHeritageKind = heritageKindFilter === 'All' || site.heritageKind === heritageKindFilter
    return matchSearch && matchVuln && matchHeritageKind
  })

  const total = sites.length
  const high = sites.filter((site) => site.vulnerability === 'High').length
  const medium = sites.filter((site) => site.vulnerability === 'Medium').length
  const low = sites.filter((site) => site.vulnerability === 'Low').length
  const activeFilterText = [
    vulnFilter !== 'All' ? vulnFilter : null,
    heritageKindFilter !== 'All' ? heritageKindFilter : null,
  ].filter(Boolean).join(' + ')

  const downloadHeritageData = async () => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      let data = heritageData
      if (!data) {
        const response = await fetch(HERITAGE_DATA_URL)
        if (!response.ok) {
          throw new Error('Could not download heritage data.')
        }
        data = await response.json() as HeritageFeatureCollection
      }

      const csv = heritageGeoJsonToCsv(data)
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'heritage_registry.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not download heritage data.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="px-8 py-8 min-h-full" style={{ background: '#F0EDE8' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-gray-900">Heritage Registry</h1>
        <button
          type="button"
          onClick={() => {
            setAddSiteNotice(null)
            setIsAddSiteOpen(true)
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </button>
      </div>

      {addSiteNotice && (
        <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg px-4 py-3 text-sm font-semibold">
          {addSiteNotice}
        </div>
      )}

      {loadError && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm font-semibold">
          {loadError}
        </div>
      )}

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
          value={heritageKindFilter}
          onChange={(e) => setHeritageKindFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer"
        >
          <option value="All">All heritage</option>
          {heritageKindOptions.map((heritageKind) => (
            <option key={heritageKind} value={heritageKind}>{heritageKind}</option>
          ))}
        </select>
        <button
          onClick={downloadHeritageData}
          disabled={isDownloading}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          {isDownloading ? 'Downloading...' : 'Download heritage data'}
        </button>
      </div>
      {downloadError && (
        <div className="mb-4 text-sm font-semibold text-red-700">
          {downloadError}
        </div>
      )}
      {heritageData && (
        <div className="mb-3 text-xs font-semibold text-gray-400">
          Showing {filtered.length} of {total} heritage places
          {activeFilterText ? ` for ${activeFilterText}` : ''}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Site name', 'Heritage type', 'Heritage kind', 'Slope', 'Fuel type', 'Burn context', 'Vulnerability', 'Score', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={`${vulnFilter}-${heritageKindFilter}-${search}`}>
            {!heritageData && !loadError ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Loading heritage registry data...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No heritage places match the selected filters
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
                  <td className="px-4 py-3">{heritageKindBadge(site.heritageKind)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {site.slope === null ? 'Unknown' : `${site.slope.toFixed(2)} deg`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{site.fuelType}</td>
                  <td className="px-4 py-3 text-gray-600">{site.burnContext}</td>
                  <td className="px-4 py-3">{vulnerabilityPill(site.vulnerability)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {site.score === null ? 'Unknown' : site.score}
                  </td>
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

      <AddSiteModal
        open={isAddSiteOpen}
        onClose={() => setIsAddSiteOpen(false)}
        onSubmitted={() => {
          setIsAddSiteOpen(false)
          setAddSiteNotice('Site submitted (pending backend integration).')
        }}
        heritageTypeOptions={heritageTypeOptions}
        fuelTypeOptions={fuelTypeOptions}
        burnContextOptions={burnContextOptions}
      />
    </div>
  )
}

export default HeritagRegistry
