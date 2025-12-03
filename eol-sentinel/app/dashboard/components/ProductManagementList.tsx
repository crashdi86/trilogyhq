'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import EditProductDetailsModal from './EditProductDetailsModal'

interface Product {
  id: string
  name: string
  logo_url: string | null
  arr: number | null
  cost: number | null
  customer_count: number | null
  credentials: string | null
  documents: string | null
  support_url: string | null
  note: string | null
  created_at: string
}

export default function ProductManagementList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Error loading products')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found. Add products from the Dashboard.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {product.logo_url && (
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <img
                        src={product.logo_url}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <button
                    onClick={() => setEditingProductId(product.id)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="Edit product details"
                  >
                    <i className="fa-solid fa-pencil text-sm"></i>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ARR</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.arr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cost</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customers</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.customer_count?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Credentials
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {product.credentials || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Documents
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {product.documents || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Support URL
                </p>
                {product.support_url ? (
                  <a
                    href={product.support_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    {product.support_url}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not set</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Note</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {product.note || (
                    <span className="text-gray-400 italic">No notes</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingProductId && (
        <EditProductDetailsModal
          product={products.find((p) => p.id === editingProductId)!}
          onClose={() => {
            setEditingProductId(null)
            loadProducts()
          }}
          onSuccess={() => {
            setEditingProductId(null)
            loadProducts()
          }}
        />
      )}
    </>
  )
}

