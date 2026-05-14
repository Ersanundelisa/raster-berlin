'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { LoginModal } from '@/components/ui/LoginModal'

interface Props {
  entityId: string
  entityType: 'event' | 'venue'
}

export function SaveButton({ entityId, entityType }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createBrowserClient(), [])

  const table = entityType === 'event' ? 'saved_events' : 'saved_venues'
  const column = entityType === 'event' ? 'sanity_event_id' : 'sanity_venue_id'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)
      if (!uid) return
      supabase.from(table).select('id').eq('user_id', uid).eq(column, entityId).single()
        .then(({ data }) => setSaved(!!data))
    })
  }, [supabase, entityId, table, column])

  async function toggle() {
    if (!userId) { setShowLogin(true); return }
    setLoading(true)
    if (saved) {
      await supabase.from(table).delete().eq('user_id', userId).eq(column, entityId)
      setSaved(false)
    } else {
      await supabase.from(table).insert({ user_id: userId, [column]: entityId })
      setSaved(true)
    }
    setLoading(false)
  }

  async function handleLoginSuccess() {
    setShowLogin(false)
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) return
    setUserId(uid)
    setLoading(true)
    await supabase.from(table).insert({ user_id: uid, [column]: entityId })
    setSaved(true)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
          saved ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
        }`}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? 'Saved' : 'Save'}
      </button>
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
      )}
    </>
  )
}
