import { sanityClient } from '@/lib/sanity/client'
import { upcomingEventsQuery } from '@/lib/sanity/queries'
import { CalendarView } from '@/components/events/CalendarView'

export const revalidate = 1800

export default async function EventsPage() {
  const events = await sanityClient.fetch(upcomingEventsQuery)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Events</h1>
      <p className="text-gray-500 text-sm mb-10">Openings, talks, and guided tours in Berlin</p>
      <CalendarView events={events} />
    </div>
  )
}
