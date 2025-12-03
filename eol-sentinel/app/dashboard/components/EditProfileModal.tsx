'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface EditProfileModalProps {
  user: any
  onClose: () => void
}

export default function EditProfileModal({
  user,
  onClose,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''
  )
  const [role, setRole] = useState(user?.user_metadata?.role || 'Product Manager')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setDisplayName(
        user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''
      )
      setRole(user?.user_metadata?.role || 'Product Manager')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          role: role.trim(),
        },
      })

      if (updateError) {
        throw new Error('Failed to update profile: ' + updateError.message)
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-black mb-4">
          Edit Profile
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-black mb-1"
            >
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter your display name"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-black mb-1"
            >
              Role
            </label>
            <input
              id="role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Product Manager"
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

