import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

export type AddSiteFormData = {
  site_name: string
  heritage_type: string
  heritage_kind: 'aboriginal' | 'non-aboriginal' | ''
  slope: string
  fuel_type: string
  burn_context: string
  vulnerability_score: string
  vulnerability_level: 'High' | 'Medium' | 'Low' | ''
  longitude: string
  latitude: string
  added_by_user_name: string
  heritage_photo: File | null
}

type AddSiteModalProps = {
  open: boolean
  onClose: () => void
  onSubmitted: (feature: HeritageFeature) => void
  heritageTypeOptions: string[]
  fuelTypeOptions: string[]
  burnContextOptions: string[]
}

type HeritageFeature = {
  type: string
  geometry: {
    type: string
    coordinates: unknown
  } | null
  properties: Record<string, unknown>
}

const EMPTY_FORM: AddSiteFormData = {
  site_name: '',
  heritage_type: '',
  heritage_kind: '',
  slope: '',
  fuel_type: '',
  burn_context: '',
  vulnerability_score: '',
  vulnerability_level: '',
  longitude: '',
  latitude: '',
  added_by_user_name: '',
  heritage_photo: null,
}

type Errors = Partial<Record<keyof AddSiteFormData, string>>

const isBlank = (value: string) => value.trim() === ''

const isFiniteNumber = (value: string) => {
  if (isBlank(value)) return false
  const parsed = Number(value)
  return Number.isFinite(parsed)
}

const validate = (data: AddSiteFormData): Errors => {
  const errors: Errors = {}

  if (isBlank(data.site_name)) errors.site_name = 'Site name is required.'
  if (isBlank(data.heritage_type)) errors.heritage_type = 'Heritage type is required.'
  if (data.heritage_kind === '') errors.heritage_kind = 'Heritage kind is required.'
  if (isBlank(data.fuel_type)) errors.fuel_type = 'Fuel type is required.'
  if (isBlank(data.burn_context)) errors.burn_context = 'Burn context is required.'
  if (data.vulnerability_level === '') errors.vulnerability_level = 'Vulnerability level is required.'
  if (isBlank(data.added_by_user_name)) errors.added_by_user_name = 'Your name is required.'

  if (!isFiniteNumber(data.slope)) {
    errors.slope = 'Slope must be a number (degrees).'
  } else {
    const slope = Number(data.slope)
    if (slope < 0 || slope > 90) errors.slope = 'Slope must be between 0 and 90 degrees.'
  }

  if (!isFiniteNumber(data.vulnerability_score)) {
    errors.vulnerability_score = 'Vulnerability score must be a number.'
  } else {
    const score = Number(data.vulnerability_score)
    if (score < 0 || score > 100) errors.vulnerability_score = 'Vulnerability score must be between 0 and 100.'
  }

  if (!isFiniteNumber(data.longitude)) {
    errors.longitude = 'Longitude must be a number.'
  } else {
    const lon = Number(data.longitude)
    if (lon < -180 || lon > 180) errors.longitude = 'Longitude must be between -180 and 180.'
  }

  if (!isFiniteNumber(data.latitude)) {
    errors.latitude = 'Latitude must be a number.'
  } else {
    const lat = Number(data.latitude)
    if (lat < -90 || lat > 90) errors.latitude = 'Latitude must be between -90 and 90.'
  }

  return errors
}

const fieldLabelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1'
const fieldInputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400'
const fieldErrorClass = 'mt-1 text-xs font-semibold text-red-600'
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000'

const AddSiteModal = ({
  open,
  onClose,
  onSubmitted,
  heritageTypeOptions,
  fuelTypeOptions,
  burnContextOptions,
}: AddSiteModalProps) => {
  const [formData, setFormData] = useState<AddSiteFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormData(EMPTY_FORM)
      setErrors({})
      setSubmitError(null)
      setSubmitting(false)
    }
  }, [open])

  if (!open) return null

  const handleChange = <K extends keyof AddSiteFormData>(
    field: K,
    value: AddSiteFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleChange('heritage_photo', file)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/heritage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          heritage_photo: undefined,
          slope: Number(formData.slope),
          longitude: Number(formData.longitude),
          latitude: Number(formData.latitude),
          vulnerability_score: Number(formData.vulnerability_score),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error ?? 'Could not submit heritage site.')
      }

      onSubmitted(result.feature as HeritageFeature)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit heritage site.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-site-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="add-site-title" className="text-lg font-black text-gray-900">
            Add Site
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={fieldLabelClass} htmlFor="site_name">Site name *</label>
            <input
              id="site_name"
              type="text"
              value={formData.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              className={fieldInputClass}
              autoComplete="off"
            />
            {errors.site_name && <p className={fieldErrorClass}>{errors.site_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass} htmlFor="heritage_type">Heritage type *</label>
              <select
                id="heritage_type"
                value={formData.heritage_type}
                onChange={(e) => handleChange('heritage_type', e.target.value)}
                className={fieldInputClass}
              >
                <option value="">Select…</option>
                {heritageTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.heritage_type && <p className={fieldErrorClass}>{errors.heritage_type}</p>}
            </div>

            <div>
              <label className={fieldLabelClass}>Heritage kind *</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="heritage_kind"
                    value="aboriginal"
                    checked={formData.heritage_kind === 'aboriginal'}
                    onChange={() => handleChange('heritage_kind', 'aboriginal')}
                  />
                  Aboriginal
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="heritage_kind"
                    value="non-aboriginal"
                    checked={formData.heritage_kind === 'non-aboriginal'}
                    onChange={() => handleChange('heritage_kind', 'non-aboriginal')}
                  />
                  Non-Aboriginal
                </label>
              </div>
              {errors.heritage_kind && <p className={fieldErrorClass}>{errors.heritage_kind}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass} htmlFor="fuel_type">Fuel type *</label>
              <select
                id="fuel_type"
                value={formData.fuel_type}
                onChange={(e) => handleChange('fuel_type', e.target.value)}
                className={fieldInputClass}
              >
                <option value="">Select…</option>
                {fuelTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.fuel_type && <p className={fieldErrorClass}>{errors.fuel_type}</p>}
            </div>

            <div>
              <label className={fieldLabelClass} htmlFor="burn_context">Burn context *</label>
              <select
                id="burn_context"
                value={formData.burn_context}
                onChange={(e) => handleChange('burn_context', e.target.value)}
                className={fieldInputClass}
              >
                <option value="">Select…</option>
                {burnContextOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.burn_context && <p className={fieldErrorClass}>{errors.burn_context}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={fieldLabelClass} htmlFor="slope">Slope (deg) *</label>
              <input
                id="slope"
                type="number"
                step="any"
                min={0}
                max={90}
                value={formData.slope}
                onChange={(e) => handleChange('slope', e.target.value)}
                className={fieldInputClass}
              />
              {errors.slope && <p className={fieldErrorClass}>{errors.slope}</p>}
            </div>
            <div>
              <label className={fieldLabelClass} htmlFor="longitude">Longitude *</label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                className={fieldInputClass}
              />
              {errors.longitude && <p className={fieldErrorClass}>{errors.longitude}</p>}
            </div>
            <div>
              <label className={fieldLabelClass} htmlFor="latitude">Latitude *</label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                className={fieldInputClass}
              />
              {errors.latitude && <p className={fieldErrorClass}>{errors.latitude}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelClass} htmlFor="vulnerability_score">Vulnerability score *</label>
              <input
                id="vulnerability_score"
                type="number"
                step="any"
                min={0}
                max={100}
                value={formData.vulnerability_score}
                onChange={(e) => handleChange('vulnerability_score', e.target.value)}
                className={fieldInputClass}
              />
              {errors.vulnerability_score && <p className={fieldErrorClass}>{errors.vulnerability_score}</p>}
            </div>

            <div>
              <label className={fieldLabelClass} htmlFor="vulnerability_level">Vulnerability level *</label>
              <select
                id="vulnerability_level"
                value={formData.vulnerability_level}
                onChange={(e) => handleChange('vulnerability_level', e.target.value as AddSiteFormData['vulnerability_level'])}
                className={fieldInputClass}
              >
                <option value="">Select…</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {errors.vulnerability_level && <p className={fieldErrorClass}>{errors.vulnerability_level}</p>}
            </div>
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="added_by_user_name">Submitted by *</label>
            <input
              id="added_by_user_name"
              type="text"
              value={formData.added_by_user_name}
              onChange={(e) => handleChange('added_by_user_name', e.target.value)}
              className={fieldInputClass}
              autoComplete="name"
            />
            {errors.added_by_user_name && <p className={fieldErrorClass}>{errors.added_by_user_name}</p>}
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="heritage_photo">Heritage photo (optional)</label>
            <input
              id="heritage_photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:text-sm file:font-bold hover:file:bg-gray-700"
            />
            {formData.heritage_photo && (
              <p className="mt-1 text-xs text-gray-500">
                {formData.heritage_photo.name} ({Math.round(formData.heritage_photo.size / 1024)} KB)
              </p>
            )}
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 text-sm font-semibold">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSiteModal
