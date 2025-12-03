'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EditProfileModal from './EditProfileModal'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadUser()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const role = user?.user_metadata?.role || 'Product Manager'

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Dashboard Overview
            </h2>
            <p className="text-gray-600 mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your products.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              {mounted && <i className="fa-solid fa-bell text-xl"></i>}
              {!mounted && <span className="w-5 h-5"></span>}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {mounted && (
                  <i className="fa-solid fa-user text-gray-500 text-lg"></i>
                )}
                {!mounted && <span className="w-5 h-5"></span>}
              </div>
              <div className="cursor-pointer" onClick={() => setShowEditModal(true)}>
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => {
            setShowEditModal(false)
            loadUser()
          }}
        />
      )}
    </>
  )
}

