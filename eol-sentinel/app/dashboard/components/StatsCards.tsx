'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalComponents: 0,
    expiredComponents: 0,
    warningComponents: 0,
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id')

      // Only fetch components linked to products (same logic as EOLTrackerTable)
      const { data: components } = await supabase
        .from('components')
        .select('id, slug, version, manual_eol_date, product_id')
        .not('product_id', 'is', null) // Only components linked to products

      // Calculate EOL status for components
      let expired = 0
      let warning = 0

      if (components) {
        for (const component of components) {
          let daysRemaining: number | null = null

          // Check manual EOL date first
          if (component.manual_eol_date) {
            const eolDate = new Date(component.manual_eol_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            eolDate.setHours(0, 0, 0, 0)
            daysRemaining = Math.ceil(
              (eolDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
          } else if (component.slug && component.slug !== 'manual') {
            // Fetch from API for non-manual components
            try {
              const response = await fetch(
                `https://endoflife.date/api/${component.slug}.json`
              )
              if (response.ok) {
                const cycles = await response.json()
                const cycle = cycles.find((c: any) => c.cycle === component.version)
                if (cycle?.eol) {
                  const eolDate = new Date(cycle.eol)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  eolDate.setHours(0, 0, 0, 0)
                  daysRemaining = Math.ceil(
                    (eolDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  )
                }
              }
            } catch (err) {
              // Skip invalid components
            }
          }

          // Categorize based on days remaining
          if (daysRemaining !== null) {
            if (daysRemaining < 0) {
              expired++
            } else if (daysRemaining < 365) {
              warning++
            }
          }
        }
      }

      setStats({
        totalProducts: products?.length || 0,
        totalComponents: components?.length || 0,
        expiredComponents: expired,
        warningComponents: warning,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalProducts}
            </p>
            <p className="text-sm text-green-600 mt-2">
              {mounted && <i className="fa-solid fa-arrow-up mr-1"></i>}
              Active products
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            {mounted && <i className="fa-solid fa-box text-2xl text-blue-600"></i>}
            {!mounted && <span className="w-8 h-8"></span>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Components
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalComponents}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              {mounted && <i className="fa-solid fa-info-circle mr-1"></i>}
              Tracked components
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            {mounted && <i className="fa-solid fa-cube text-2xl text-purple-600"></i>}
            {!mounted && <span className="w-8 h-8"></span>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">At Risk</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.warningComponents}
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              {mounted && <i className="fa-solid fa-exclamation-triangle mr-1"></i>}
              &lt; 1 year remaining
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            {mounted && <i className="fa-solid fa-clock text-2xl text-yellow-600"></i>}
            {!mounted && <span className="w-8 h-8"></span>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Expired</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.expiredComponents}
            </p>
            <p className="text-sm text-red-600 mt-2">
              {mounted && <i className="fa-solid fa-times-circle mr-1"></i>}
              Past EOL date
            </p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            {mounted && <i className="fa-solid fa-exclamation-circle text-2xl text-red-600"></i>}
            {!mounted && <span className="w-8 h-8"></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

