import { sanityClient } from '@/lib/sanity/client'
import { eventBySlugQuery } from '@/lib/sanity/queries'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SaveButton } from '@/components/account/SaveButton'

export const revalidate = 3600

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await sanityClient.fetch(eventBySlugQuery, { slug })
  if (!event) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{event.eventType}</span>
        {event.isFree && <span className="text-xs text-green-600">Free</span>}
      </div>
      <h1 className="text-3xl font-semibold mb-2">{event.title}</h1>
      <p className="text-gray-500 mb-6">{formatDateTime(event.date)}</p>

      {event.venue && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium">
            <Link href={`/galleries/${event.venue.slug.current}`} className="hover:underline">
              {event.venue.name}
            </Link>
          </p>
          {event.venue.address && <p className="text-xs text-gray-500 mt-1">{event.venue.address}</p>}
          {event.venue.hours?.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{event.venue.hours[0]}</p>
          )}
        </div>
      )}

      {event.description && (
        <p className="text-gray-700 leading-relaxed mb-8">{event.description}</p>
      )}

      <SaveButton entityId={event._id} entityType="event" />
    </div>
  )
}
