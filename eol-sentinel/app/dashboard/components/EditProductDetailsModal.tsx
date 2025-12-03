'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

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
}

interface EditProductDetailsModalProps {
  product: Product
  onClose: () => void
  onSuccess: () => void
}

export default function EditProductDetailsModal({
  product,
  onClose,
  onSuccess,
}: EditProductDetailsModalProps) {
  const [name, setName] = useState(product.name)
  const [arr, setArr] = useState(product.arr?.toString() || '')
  const [cost, setCost] = useState(product.cost?.toString() || '')
  const [customerCount, setCustomerCount] = useState(
    product.customer_count?.toString() || ''
  )
  const [credentials, setCredentials] = useState(product.credentials || '')
  const [documents, setDocuments] = useState(product.documents || '')
  const [supportUrl, setSupportUrl] = useState(product.support_url || '')
  const [note, setNote] = useState(product.note || '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(product.logo_url)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setName(product.name)
    setArr(product.arr?.toString() || '')
    setCost(product.cost?.toString() || '')
    setCustomerCount(product.customer_count?.toString() || '')
    setCredentials(product.credentials || '')
    setDocuments(product.documents || '')
    setSupportUrl(product.support_url || '')
    setNote(product.note || '')
    setLogoPreview(product.logo_url)
    setLogoFile(null)
  }, [product])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let logoUrl: string | null = product.logo_url

      // Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error('Failed to upload logo: ' + uploadError.message)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('logos').getPublicUrl(filePath)
        logoUrl = publicUrl
      }

      const updateData: any = {
        name: name.trim(),
        logo_url: logoUrl,
        credentials: credentials.trim() || null,
        documents: documents.trim() || null,
        support_url: supportUrl.trim() || null,
        note: note.trim() || null,
      }

      if (arr.trim()) {
        updateData.arr = parseFloat(arr)
      } else {
        updateData.arr = null
      }

      if (cost.trim()) {
        updateData.cost = parseFloat(cost)
      } else {
        updateData.cost = null
      }

      if (customerCount.trim()) {
        updateData.customer_count = parseInt(customerCount)
      } else {
        updateData.customer_count = null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (updateError) {
        throw new Error('Failed to update product: ' + updateError.message)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-4">
          Edit Product Details
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="product-name"
              className="block text-sm font-medium text-black mb-1"
            >
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label
              htmlFor="logo-upload"
              className="block text-sm font-medium text-black mb-1"
            >
              Logo (Optional)
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {logoPreview && (
              <div className="mt-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-contain border border-gray-300 rounded"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="arr"
                className="block text-sm font-medium text-black mb-1"
              >
                ARR
              </label>
              <input
                id="arr"
                type="number"
                step="0.01"
                value={arr}
                onChange={(e) => setArr(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-black mb-1"
              >
                Cost
              </label>
              <input
                id="cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div>
              <label
                htmlFor="customer-count"
                className="block text-sm font-medium text-black mb-1"
              >
                Customer Count
              </label>
              <input
                id="customer-count"
                type="number"
                value={customerCount}
                onChange={(e) => setCustomerCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="credentials"
              className="block text-sm font-medium text-black mb-1"
            >
              Credentials
            </label>
            <textarea
              id="credentials"
              rows={4}
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter credentials information..."
            />
          </div>

          <div>
            <label
              htmlFor="documents"
              className="block text-sm font-medium text-black mb-1"
            >
              Documents
            </label>
            <textarea
              id="documents"
              rows={4}
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter document links or information..."
            />
          </div>

          <div>
            <label
              htmlFor="support-url"
              className="block text-sm font-medium text-black mb-1"
            >
              Support URL
            </label>
            <input
              id="support-url"
              type="url"
              value={supportUrl}
              onChange={(e) => setSupportUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="https://support.example.com"
            />
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-sm font-medium text-black mb-1"
            >
              Note
            </label>
            <textarea
              id="note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter any additional notes..."
            />
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

