'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  eventId: string
}

export function JournalEditor({ userId, eventId }: Props) {
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = useMemo(() => createBrowserClient(), [])
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    supabase.from('journal_entries')
      .select('body')
      .eq('user_id', userId)
      .eq('sanity_event_id', eventId)
      .single()
      .then(({ data }) => { if (data) setBody(data.body) })
  }, [supabase, userId, eventId])

  async function save() {
    setSaving(true)
    await supabase.from('journal_entries').upsert(
      { user_id: userId, sanity_event_id: eventId, body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,sanity_event_id' }
    )
    setSaving(false)
    setSaved(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className="mt-4">
      <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2">My Notes</h3>
      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); setSaved(false) }}
        placeholder="Write your thoughts about this event…"
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
      />
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 text-xs bg-black text-white rounded-full px-4 py-1.5 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save note'}
      </button>
    </div>
  )
}
