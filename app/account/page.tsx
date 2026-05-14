export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sanityClient } from '@/lib/sanity/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { JournalEditor } from '@/components/account/JournalEditor'

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: savedEvents } = await supabase
    .from('saved_events')
    .select('*, journal_entries(*)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const { data: savedVenues } = await supabase
    .from('saved_venues')
    .select('*')
    .eq('user_id', user.id)

  let eventDetails: any[] = []
  if (savedEvents && savedEvents.length > 0) {
    const ids = savedEvents.map((s: any) => s.sanity_event_id)
    eventDetails = await sanityClient.fetch(
      `*[_type == "event" && _id in $ids] { _id, title, slug, date, eventType, "venue": venue->{ name, slug } }`,
      { ids }
    )
  }

  let venueDetails: any[] = []
  if (savedVenues && savedVenues.length > 0) {
    const ids = savedVenues.map((s: any) => s.sanity_venue_id)
    venueDetails = await sanityClient.fetch(
      `*[_type == "gallery" && _id in $ids] { _id, name, slug, venueType, neighborhood }`,
      { ids }
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">My Art Journal</h1>
      <p className="text-gray-400 text-sm mb-10">{user.email}</p>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Saved Events</h2>
        {eventDetails.length === 0 && (
          <p className="text-sm text-gray-400">No saved events yet. <Link href="/events" className="underline">Browse events</Link></p>
        )}
        {eventDetails.map((ev: any) => (
          <div key={ev._id} className="border-b border-gray-100 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">{ev.eventType} · {formatDateTime(ev.date)}</p>
                <Link href={`/events/${ev.slug.current}`} className="font-medium text-sm hover:underline">{ev.title}</Link>
                {ev.venue?.slug?.current && (
                  <Link href={`/galleries/${ev.venue.slug.current}`} className="block text-xs text-gray-500 hover:underline mt-0.5">
                    {ev.venue.name}
                  </Link>
                )}
              </div>
            </div>
            <JournalEditor userId={user.id} eventId={ev._id} />
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Saved Galleries & Museums</h2>
        {venueDetails.length === 0 && (
          <p className="text-sm text-gray-400">No saved venues yet. <Link href="/galleries" className="underline">Browse galleries</Link></p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {venueDetails.map((v: any) => (
            <Link key={v._id} href={`/galleries/${v.slug.current}`}
              className="p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
              <p className="text-xs text-gray-400 mb-1">{v.venueType} · {v.neighborhood}</p>
              <p className="text-sm font-medium">{v.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
