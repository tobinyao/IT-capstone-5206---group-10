import { Link } from 'react-router-dom'

type FuelRow = { type: string; risk: number }
type HeritageRow = { type: string; risk: number }

const FUEL_TYPES: FuelRow[] = [
  { type: 'Tall closed forest', risk: 100 },
  { type: 'Closed forest', risk: 96 },
  { type: 'Pine plantation', risk: 94 },
  { type: 'Tall open forest', risk: 92 },
  { type: 'Tall shrubland', risk: 88 },
  { type: 'Open forest', risk: 86 },
  { type: 'Woodland with shrubby understory', risk: 84 },
  { type: 'Shrubland', risk: 82 },
  { type: 'Low woodland', risk: 67 },
  { type: 'Grassland', risk: 62 },
  { type: 'Sedgeland', risk: 58 },
  { type: 'Cropland', risk: 50 },
  { type: 'Wetland', risk: 35 },
  { type: 'Sparse grassland', risk: 34 },
  { type: 'Built-up', risk: 26 },
  { type: 'Bare ground', risk: 12 },
  { type: 'Water', risk: 5 },
]

const HERITAGE_TYPES: HeritageRow[] = [
  { type: 'Modified tree / timber', risk: 95 },
  { type: 'Rock art / painting', risk: 86 },
  { type: 'Burial / cemetery', risk: 76 },
  { type: 'Ceremonial / dreaming', risk: 72 },
  { type: 'General built heritage', risk: 72 },
  { type: 'Midden / organic', risk: 62 },
  { type: 'Camp / historical', risk: 60 },
  { type: 'Artefact scatter / quarry', risk: 52 },
  { type: 'Brick / stone / masonry', risk: 46 },
]

const DATA_SOURCES = [
  {
    dataset: 'Aboriginal Cultural Heritage Register',
    source: 'DPLH 099',
    use: 'Heritage location and type',
  },
  {
    dataset: 'Aboriginal Cultural Heritage Lodged',
    source: 'DPLH 100',
    use: 'Heritage location and type',
  },
  {
    dataset: 'State Heritage Register',
    source: 'DPLH 006',
    use: 'Heritage location and type',
  },
  {
    dataset: 'DBCA Burn Options Program',
    source: 'DBCA 007',
    use: 'Burn context (inside / outside proposed burns)',
  },
  {
    dataset: 'Bushfire Fuel Classification',
    source: 'NBIC release 2',
    use: 'Fuel type per grid cell',
  },
  {
    dataset: 'DEM-derived slope raster',
    source: 'Statewide DEM',
    use: 'Slope risk per grid cell',
  },
  {
    dataset: 'Geology 500k Interpreted Bedrock',
    source: 'GSWA',
    use: 'Granite influence (supplementary)',
  },
]

const FuelRiskBar = ({ value }: { value: number }) => (
  <div className="w-32 h-2 rounded-full bg-gray-100 overflow-hidden">
    <div
      className="h-full rounded-full"
      style={{
        width: `${value}%`,
        background:
          value >= 80
            ? '#B91C1C'
            : value >= 60
            ? '#D97706'
            : value >= 40
            ? '#CA8A04'
            : '#16A34A',
      }}
    />
  </div>
)

const SectionHeading = ({
  number,
  title,
  subtitle,
}: {
  number: string
  title: string
  subtitle?: string
}) => (
  <div className="mb-6">
    <div className="text-[11px] font-bold tracking-widest uppercase text-[#8B2020] mb-1">
      Section {number}
    </div>
    <h2 className="text-2xl font-black text-gray-900">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
)

const MitigationGuide = () => {
  return (
    <div className="px-8 py-8 min-h-full" style={{ background: '#F0EDE8' }}>
      {/* Back link */}
      <Link
        to="/regulation"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Fire Risk Regulation
      </Link>

      {/* Hero */}
      <div className="max-w-5xl mb-12">
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
          Mitigation Guide & Methodology
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Understand how heritage fire vulnerability is calculated, what data
          drives each factor, and what mitigation actions to take for each risk
          level.
        </p>
      </div>

      {/* Section 1 — Calculation overview */}
      <section className="max-w-5xl mb-16">
        <SectionHeading
          number="01"
          title="How vulnerability is calculated"
          subtitle="A weighted combination of four risk factors, each scored 0–100."
        />

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Vulnerability score formula
            </div>
            <div className="text-lg md:text-xl font-mono font-bold text-gray-900 leading-relaxed">
              <span className="text-[#8B2020]">Fuel × 0.45</span>
              {' + '}
              <span className="text-amber-700">Slope × 0.25</span>
              {' + '}
              <span className="text-indigo-700">Heritage Type × 0.25</span>
              {' + '}
              <span className="text-gray-600">Burn Context × 0.05</span>
            </div>
          </div>

          {/* Stacked weight bar */}
          <div className="flex h-10 rounded-lg overflow-hidden border border-gray-200">
            <div
              className="flex items-center justify-center bg-[#8B2020] text-white text-xs font-bold"
              style={{ width: '45%' }}
            >
              Fuel 45%
            </div>
            <div
              className="flex items-center justify-center bg-amber-600 text-white text-xs font-bold"
              style={{ width: '25%' }}
            >
              Slope 25%
            </div>
            <div
              className="flex items-center justify-center bg-indigo-600 text-white text-xs font-bold"
              style={{ width: '25%' }}
            >
              Heritage 25%
            </div>
            <div
              className="flex items-center justify-center bg-gray-500 text-white text-[10px] font-bold"
              style={{ width: '5%' }}
            >
              5%
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-red-100 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-red-700 mb-2">
              High
            </div>
            <div className="text-3xl font-black text-gray-900">≥ 64.2</div>
            <div className="text-xs text-gray-500 mt-2">
              Top ~5% of FRK heritage sites
            </div>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              Medium
            </div>
            <div className="text-3xl font-black text-gray-900">48.3 – 64.2</div>
            <div className="text-xs text-gray-500 mt-2">Monitor closely</div>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
              Low
            </div>
            <div className="text-3xl font-black text-gray-900">&lt; 48.3</div>
            <div className="text-xs text-gray-500 mt-2">Routine monitoring</div>
          </div>
        </div>
      </section>

      {/* Section 2 — Input variables */}
      <section className="max-w-5xl mb-16">
        <SectionHeading
          number="02"
          title="Input variables"
          subtitle="Each factor is normalised to a 0–100 risk score before weighting."
        />

        {/* Fuel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#8B2020]">
                Weight 45%
              </div>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                Fuel Type
              </h3>
            </div>
            <div className="text-xs text-gray-400">
              Source: NBIC Bushfire Fuel Classification
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Categorical mapping of 17 vegetation classes to a 0–100 risk score.
            Forested classes carry the highest risk; bare ground and water carry
            the lowest.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {FUEL_TYPES.map((row) => (
              <div
                key={row.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{row.type}</span>
                <div className="flex items-center gap-3">
                  <FuelRiskBar value={row.risk} />
                  <span className="font-mono font-bold text-gray-900 w-8 text-right">
                    {row.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slope */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                Weight 25%
              </div>
              <h3 className="text-xl font-black text-gray-900 mt-1">Slope</h3>
            </div>
            <div className="text-xs text-gray-400">
              Source: DEM-derived slope raster
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Continuous variable in degrees. Steeper terrain accelerates fire
            spread uphill, sharply raising risk above 15°.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">0 – 5°</div>
              <div className="text-lg font-black text-gray-900">Risk = 12</div>
              <div className="text-[11px] text-gray-500 mt-1">Flat / gentle</div>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">5 – 15°</div>
              <div className="text-lg font-black text-gray-900">12 → 50</div>
              <div className="text-[11px] text-gray-500 mt-1">Linear</div>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">15 – 25°</div>
              <div className="text-lg font-black text-gray-900">50 → 100</div>
              <div className="text-[11px] text-gray-500 mt-1">Linear, steeper</div>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">≥ 25°</div>
              <div className="text-lg font-black text-gray-900">Risk = 100</div>
              <div className="text-[11px] text-gray-500 mt-1">Saturates</div>
            </div>
          </div>
        </div>

        {/* Heritage Type */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">
                Weight 25%
              </div>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                Heritage Type
              </h3>
            </div>
            <div className="text-xs text-gray-400">
              Source: ACHIS + Inherit registries
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Each heritage category has a different intrinsic vulnerability to
            fire damage. Organic and tree-based features are most fragile;
            stone-based features the most resilient.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {HERITAGE_TYPES.map((row) => (
              <div
                key={row.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{row.type}</span>
                <div className="flex items-center gap-3">
                  <FuelRiskBar value={row.risk} />
                  <span className="font-mono font-bold text-gray-900 w-8 text-right">
                    {row.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Burn Context */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                Weight 5%
              </div>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                Burn Context
              </h3>
            </div>
            <div className="text-xs text-gray-400">
              Source: DBCA Burn Options Program
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Boolean flag for whether a heritage site falls inside a DBCA
            proposed prescribed burn area. Small weight, but acts as a tiebreaker
            for management prioritisation.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">
                Outside burn option
              </div>
              <div className="text-lg font-black text-gray-900">Risk = 0</div>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-400 font-semibold">
                Inside burn option
              </div>
              <div className="text-lg font-black text-gray-900">Risk = 100</div>
            </div>
          </div>
        </div>

        {/* Granite (supplementary) */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Supplementary (not in main score)
              </div>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                Granite Influence
              </h3>
            </div>
            <div className="text-xs text-gray-400">
              Source: Geology 500k Interpreted Bedrock
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Granite outcrops can act as natural firebreaks and influence local
            fuel patterns. Used for contextual interpretation only — does not
            enter the weighted score.
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'None', value: 0 },
              { label: 'Low', value: 25 },
              { label: 'Medium', value: 50 },
              { label: 'High', value: 75 },
              { label: 'Very High', value: 100 },
            ].map((g) => (
              <div
                key={g.label}
                className="border border-gray-100 rounded-lg p-2"
              >
                <div className="text-[11px] text-gray-400 font-semibold">
                  {g.label}
                </div>
                <div className="text-base font-black text-gray-900">
                  {g.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Data sources */}
      <section className="max-w-5xl mb-16">
        <SectionHeading
          number="03"
          title="Data sources"
          subtitle="All datasets are publicly sourced from authoritative WA registries and surveys."
        />
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Dataset', 'Source ID', 'Use in model'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA_SOURCES.map((row) => (
                <tr key={row.dataset} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {row.dataset}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {row.source}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — Mitigation actions */}
      <section className="max-w-5xl mb-16">
        <SectionHeading
          number="04"
          title="Mitigation actions by risk level"
          subtitle="Recommended response for each vulnerability tier."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* High */}
          <div className="bg-white rounded-2xl border-t-4 border-red-600 border-x border-b border-gray-200 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-red-700 mb-2">
              High vulnerability
            </div>
            <p className="text-sm text-gray-700 font-semibold mb-4">
              Immediate action required. Emergency documentation needed before
              fire season.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                Emergency documentation (photographs, 3D scans where possible)
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                Notify Traditional Owners and Heritage Council
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                Request a heritage exclusion zone from DBCA
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                Coordinate prescribed burn timing with district planner
              </li>
            </ul>
          </div>

          {/* Medium */}
          <div className="bg-white rounded-2xl border-t-4 border-amber-500 border-x border-b border-gray-200 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              Medium vulnerability
            </div>
            <p className="text-sm text-gray-700 font-semibold mb-4">
              Monitor closely. Schedule inspection and consult Traditional
              Owners.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                Schedule a site inspection within 4 weeks
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                Consult Traditional Owners on cultural significance
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                Review fuel management plan for the surrounding area
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">•</span>
                Re-assess after each prescribed burn cycle
              </li>
            </ul>
          </div>

          {/* Low */}
          <div className="bg-white rounded-2xl border-t-4 border-green-600 border-x border-b border-gray-200 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
              Low vulnerability
            </div>
            <p className="text-sm text-gray-700 font-semibold mb-4">
              Routine monitoring sufficient. Include in annual planning cycle.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">•</span>
                Maintain routine 6-monthly monitoring
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">•</span>
                Engage Traditional Owners in seasonal planning
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">•</span>
                Record condition changes in the registry
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">•</span>
                Annual review at end of fire season
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5 — Limitations */}
      <section className="max-w-5xl mb-12">
        <SectionHeading
          number="05"
          title="Limitations & caveats"
          subtitle="The model is a decision-support tool, not a replacement for expert assessment."
        />
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="text-gray-400 mt-0.5">⚠</span>
              <span>
                <span className="font-bold">Calibrated for Franklin
                District (FRK) only.</span> Risk thresholds (High ≥ 64.2,
                Medium ≥ 48.3) are derived from the FRK study area and would
                need re-calibration before applying elsewhere.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400 mt-0.5">⚠</span>
              <span>
                <span className="font-bold">Granite influence is not in the
                main score.</span> It is shown for context and interpretation,
                not as a weighted factor.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400 mt-0.5">⚠</span>
              <span>
                <span className="font-bold">No dynamic factors.</span> The
                model does not currently account for weather, season, or time
                since last burn. Use site-specific weather and operational
                advice during fire season.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400 mt-0.5">⚠</span>
              <span>
                <span className="font-bold">User-submitted sites may be
                incomplete.</span> If a site was added by a field user but the
                spatial enrichment failed (coordinates outside coverage), some
                factors may be missing and the score will be marked Unknown.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gray-400 mt-0.5">⚠</span>
              <span>
                <span className="font-bold">Decision support, not a
                replacement.</span> The score is a triage tool. On-site expert
                assessment and consultation with Traditional Owners remain
                essential for any management decision.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default MitigationGuide
