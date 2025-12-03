export interface EndOfLifeCycle {
  cycle: string
  releaseDate: string
  eol: string | null
  latest: string
  lts?: string
}

export interface ComponentEOLStatus {
  componentId: string
  componentName: string
  slug: string
  version: string
  eolDate: string | null
  daysRemaining: number | null
  status: 'safe' | 'warning' | 'expired'
}

/**
 * Fetches EOL data for a given slug from endoflife.date API
 */
export async function fetchEOLData(slug: string): Promise<EndOfLifeCycle[]> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://endoflife.date/api/${slug}.json`, {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Don't throw error, just return empty array for invalid slugs
      if (response.status === 404) {
        console.warn(`No EOL data found for slug: ${slug}`)
      } else {
        console.warn(`Failed to fetch EOL data for slug: ${slug} (Status: ${response.status})`)
      }
      return []
    }
    
    const data = await response.json()
    // Ensure we return an array
    return Array.isArray(data) ? data : []
  } catch (error: any) {
    // Handle timeout or network errors gracefully
    if (error.name === 'AbortError') {
      console.warn(`Request timeout for slug: ${slug}`)
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn(`Network error fetching EOL data for ${slug}`)
    } else {
      console.warn(`Error fetching EOL data for ${slug}:`, error.message || error)
    }
    return []
  }
}

/**
 * Finds the EOL date for a specific version
 */
export function findEOLForVersion(
  cycles: EndOfLifeCycle[],
  version: string
): EndOfLifeCycle | null {
  return cycles.find((cycle) => cycle.cycle === version) || null
}

/**
 * Calculates days remaining until EOL
 */
export function calculateDaysRemaining(eolDate: string | null): number | null {
  if (!eolDate) return null
  
  const eol = new Date(eolDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eol.setHours(0, 0, 0, 0)
  
  const diffTime = eol.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Determines risk status based on days remaining
 */
export function getRiskStatus(daysRemaining: number | null): 'safe' | 'warning' | 'expired' {
  if (daysRemaining === null) return 'expired'
  if (daysRemaining < 0) return 'expired'
  if (daysRemaining < 365) return 'warning' // Less than 1 year
  return 'safe' // More than 1 year
}

/**
 * Gets status color for UI
 */
export function getStatusColor(status: 'safe' | 'warning' | 'expired'): string {
  switch (status) {
    case 'safe':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-300'
  }
}

