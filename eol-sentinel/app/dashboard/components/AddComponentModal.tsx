'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { fetchEOLData } from '@/utils/endoflife'

interface AddComponentModalProps {
  productId: string
  productName: string
  onClose: () => void
}

// Common API slugs from endoflife.date
const COMMON_SLUGS = [
  { value: 'mssqlserver', label: 'Microsoft SQL Server' },
  { value: 'python', label: 'Python' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'java', label: 'Java' },
  { value: 'dotnet', label: '.NET' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache HTTP Server' },
  { value: 'ubuntu', label: 'Ubuntu' },
  { value: 'debian', label: 'Debian' },
  { value: 'centos', label: 'CentOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'rails', label: 'Ruby on Rails' },
  { value: 'django', label: 'Django' },
  { value: 'spring', label: 'Spring Framework' },
  { value: 'laravel', label: 'Laravel' },
]

interface ManualComponent {
  id: string
  name: string
  version: string
  eol_date: string
}

export default function AddComponentModal({
  productId,
  productName,
  onClose,
}: AddComponentModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [useCustomSlug, setUseCustomSlug] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [selectedManualComponent, setSelectedManualComponent] = useState<string>('')
  const [manualComponents, setManualComponents] = useState<ManualComponent[]>([])
  const [version, setVersion] = useState('')
  const [versions, setVersions] = useState<string[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Load manual components when manual entry is enabled
  useEffect(() => {
    if (isManualEntry) {
      loadManualComponents()
    } else {
      setManualComponents([])
      setSelectedManualComponent('')
    }
  }, [isManualEntry])

  // Update name and version when manual component is selected
  useEffect(() => {
    if (selectedManualComponent && manualComponents.length > 0) {
      const manualComp = manualComponents.find(
        (mc) => mc.id === selectedManualComponent
      )
      if (manualComp) {
        setName(manualComp.name)
        setVersion(manualComp.version)
      }
    }
  }, [selectedManualComponent, manualComponents])

  // Fetch versions when slug changes (with debounce for custom slug)
  useEffect(() => {
    if (isManualEntry) {
      setVersions([])
      setVersion('')
      return
    }

    const activeSlug = useCustomSlug ? customSlug : slug

    if (!activeSlug) {
      setVersions([])
      setVersion('')
      return
    }

    // For dropdown selection, fetch immediately
    if (!useCustomSlug) {
      loadVersions(activeSlug)
      return
    }

    // For custom input, debounce the fetch
    const timer = setTimeout(() => {
      if (customSlug.trim()) {
        loadVersions(customSlug.trim())
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [slug, customSlug, useCustomSlug, isManualEntry])

  const loadManualComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_components')
        .select('*')
        .order('name, version')

      if (error) {
        console.error('Error loading manual components:', error)
        setManualComponents([])
      } else {
        setManualComponents(data || [])
      }
    } catch (err) {
      console.error('Error loading manual components:', err)
      setManualComponents([])
    }
  }

  const loadVersions = async (slugToLoad: string) => {
    setLoadingVersions(true)
    setVersion('')
    setError(null)

    try {
      const cycles = await fetchEOLData(slugToLoad)
      if (cycles.length > 0) {
        // Extract version cycles and sort them
        const versionList = cycles
          .map((c) => c.cycle)
          .sort((a, b) => {
            // Try to sort versions intelligently
            // For numeric versions, sort descending
            const numA = parseFloat(a)
            const numB = parseFloat(b)
            if (!isNaN(numA) && !isNaN(numB)) {
              return numB - numA
            }
            // For string versions, sort alphabetically descending
            return b.localeCompare(a)
          })
        setVersions(versionList)
        setError(null) // Clear any previous errors
      } else {
        setVersions([])
        // Don't show error for empty results - just inform user
        setError(null)
      }
    } catch (err: any) {
      setVersions([])
      // Only show error if it's not already handled by fetchEOLData
      setError(null) // fetchEOLData already handles errors gracefully
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSlug(e.target.value)
    setUseCustomSlug(false)
    setCustomSlug('')
    setIsManualEntry(false)
  }

  const handleCustomSlugToggle = () => {
    setUseCustomSlug(!useCustomSlug)
    if (!useCustomSlug) {
      setSlug('')
      setIsManualEntry(false)
    } else {
      setCustomSlug('')
    }
  }

  const handleCustomSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSlug(e.target.value)
  }

  const handleManualEntryToggle = () => {
    setIsManualEntry(!isManualEntry)
    if (!isManualEntry) {
      // Clear API-related fields
      setSlug('')
      setCustomSlug('')
      setUseCustomSlug(false)
      setVersion('')
      setVersions([])
      setName('')
    } else {
      // Clear manual selection
      setSelectedManualComponent('')
      loadManualComponents()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isManualEntry) {
      // Manual entry validation
      if (!selectedManualComponent || !name.trim() || !version.trim()) {
        setError('Please select a manual component')
        return
      }

      // Get the selected manual component to get EOL date
      const manualComp = manualComponents.find(
        (mc) => mc.id === selectedManualComponent
      )

      if (!manualComp) {
        setError('Selected manual component not found')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Insert with manual EOL date
        const { error: insertError } = await supabase.from('components').insert({
          product_id: productId,
          name: name.trim(),
          slug: 'manual',
          version: version.trim(),
          manual_eol_date: manualComp.eol_date,
        })

        if (insertError) {
          throw new Error('Failed to create component: ' + insertError.message)
        }

        onClose()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    } else {
      // API entry validation
      const activeSlug = useCustomSlug ? customSlug.trim() : slug.trim()
      if (!name.trim() || !activeSlug || !version.trim()) {
        setError('All fields are required')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Regular API entry
        const { error: insertError } = await supabase.from('components').insert({
          product_id: productId,
          name: name.trim(),
          slug: activeSlug,
          version: version.trim(),
        })

        if (insertError) {
          throw new Error('Failed to create component: ' + insertError.message)
        }

        onClose()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-black mb-2">
          Add Component to {productName}
        </h2>
        <p className="text-sm text-black mb-4">
          Track software dependencies and their EOL dates
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Manual Entry Checkbox */}
          <div className="flex items-center">
            <input
              id="manual-entry"
              type="checkbox"
              checked={isManualEntry}
              onChange={handleManualEntryToggle}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="manual-entry"
              className="ml-2 text-sm font-medium text-black"
            >
              Manual Entry (not in API)
            </label>
          </div>

          {isManualEntry ? (
            <>
              {/* Manual Component Dropdown */}
              <div>
                <label
                  htmlFor="manual-component-select"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Select Manual Component
                </label>
                <select
                  id="manual-component-select"
                  required
                  value={selectedManualComponent}
                  onChange={(e) => setSelectedManualComponent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                >
                  <option value="">Select a manual component...</option>
                  {manualComponents.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name} v{mc.version} (EOL: {new Date(mc.eol_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {manualComponents.length === 0
                    ? 'No manual components available. Add them in the Manual Components section.'
                    : `Select from ${manualComponents.length} manual component(s)`}
                </p>
                {manualComponents.length === 0 && (
                  <a
                    href="/dashboard/manual-components"
                    className="text-xs text-blue-600 hover:text-blue-700 underline mt-1 inline-block"
                  >
                    Go to Manual Components →
                  </a>
                )}
              </div>

              {/* Display selected component info (read-only) */}
              {selectedManualComponent && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <strong>Component:</strong> {name}
                  </p>
                  <p className="text-xs text-gray-600 mb-1">
                    <strong>Version:</strong> {version}
                  </p>
                  {manualComponents.find((mc) => mc.id === selectedManualComponent) && (
                    <p className="text-xs text-gray-600">
                      <strong>EOL Date:</strong>{' '}
                      {new Date(
                        manualComponents.find((mc) => mc.id === selectedManualComponent)!
                          .eol_date
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label
                  htmlFor="component-name"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Display Name
                </label>
                <input
                  id="component-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Database Layer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="api-slug"
                    className="block text-sm font-medium text-black"
                  >
                    API Slug
                  </label>
                  <button
                    type="button"
                    onClick={handleCustomSlugToggle}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {useCustomSlug ? 'Use dropdown' : 'Enter custom slug'}
                  </button>
                </div>
                {useCustomSlug ? (
                  <input
                    id="api-slug-custom"
                    type="text"
                    required
                    value={customSlug}
                    onChange={handleCustomSlugChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="e.g., mssqlserver"
                  />
                ) : (
                  <select
                    id="api-slug"
                    required
                    value={slug}
                    onChange={handleSlugChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  >
                    <option value="">Select a product...</option>
                    {COMMON_SLUGS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label} ({item.value})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {useCustomSlug
                    ? 'Enter a custom slug from endoflife.date API'
                    : 'Select a product from endoflife.date API'}
                </p>
                {loadingVersions && (
                  <p className="text-xs text-blue-600 mt-1">
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    Loading versions...
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="version"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Version
                </label>
                <select
                  id="version"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={
                    (!slug && !customSlug) ||
                    loadingVersions ||
                    versions.length === 0
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                >
                  <option value="">
                    {!slug && !customSlug
                      ? 'Select a product first...'
                      : loadingVersions
                        ? 'Loading versions...'
                        : versions.length === 0
                          ? 'No versions available'
                          : 'Select a version...'}
                  </option>
                  {versions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {(slug || customSlug) && versions.length > 0
                    ? `${versions.length} version(s) available`
                    : 'Version will be populated after selecting a product'}
                </p>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (isManualEntry
                  ? !selectedManualComponent
                  : (!slug && !customSlug) || !version || loadingVersions)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
