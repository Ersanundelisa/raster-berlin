import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

interface Props {
  event: {
    _id: string
    title: string
    slug: { current: string }
    eventType: string
    date: string
    isFree: boolean
    venue?: { name: string; slug: { current: string }; neighborhood?: string }
  }
}

export function EventCard({ event }: Props) {
  return (
    <Link href={`/events/${event.slug.current}`} className="group block p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{event.eventType}</span>
            {event.isFree && <span className="text-xs text-green-600">Free</span>}
          </div>
          <h3 className="font-medium text-sm group-hover:underline truncate">{event.title}</h3>
          {event.venue && (
            <p className="text-xs text-gray-500 mt-0.5">{event.venue.name}{event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ''}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(event.date)}</p>
        </div>
      </div>
    </Link>
  )
}
