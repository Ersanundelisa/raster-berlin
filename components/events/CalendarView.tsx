'use client'

import { useState } from 'react'
import { EventCard } from './EventCard'

interface Event {
  _id: string
  title: string
  slug: { current: string }
  eventType: string
  date: string
  isFree: boolean
  venue?: { name: string; slug: { current: string }; neighborhood?: string }
}

interface Props { events: Event[] }

const EVENT_TYPES = ['All', 'opening', 'finissage', 'talk', 'guided tour', 'performance', 'other']
const NEIGHBORHOODS = ['All', 'Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln']

export function CalendarView({ events }: Props) {
  const [type, setType] = useState('All')
  const [hood, setHood] = useState('All')
  const [freeOnly, setFreeOnly] = useState(false)

  const filtered = events.filter(e => {
    if (type !== 'All' && e.eventType !== type) return false
    if (hood !== 'All' && e.venue?.neighborhood !== hood) return false
    if (freeOnly && !e.isFree) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {EVENT_TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${type === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="w-px bg-gray-200 mx-1" />
        <select value={hood} onChange={e => setHood(e.target.value)}
          aria-label="Filter by neighborhood"
          className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-700">
          {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
        </select>
        <button onClick={() => setFreeOnly(f => !f)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${freeOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200'}`}>
          Free only
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && <p className="text-sm text-gray-400">No events match your filters.</p>}
        {filtered.map(e => <EventCard key={e._id} event={e} />)}
      </div>
    </div>
  )
}
