import { sanityClient } from '@/lib/sanity/client'
import { featuredExhibitionsQuery, upcomingEventsQuery } from '@/lib/sanity/queries'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { EventCard } from '@/components/events/EventCard'
import { formatDate } from '@/lib/utils'

export const revalidate = 3600

export default async function HomePage() {
  const [featured, upcomingEvents] = await Promise.all([
    sanityClient.fetch(featuredExhibitionsQuery),
    sanityClient.fetch(upcomingEventsQuery),
  ])

  const nextEvents = upcomingEvents.slice(0, 5)

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-none mb-6">
            Berlin<br />Art Guide
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Galleries, museums, and art events for Berlin locals.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/map" className="bg-black text-white rounded-full px-5 py-2.5 text-sm">
              Open map
            </Link>
            <Link href="/events" className="border border-gray-200 rounded-full px-5 py-2.5 text-sm hover:border-gray-400 transition-colors">
              Upcoming events
            </Link>
          </div>
        </div>
      </section>

      {/* Featured exhibitions */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">Now on</h2>
            <Link href="/galleries" className="text-xs text-gray-400 hover:text-black underline">All galleries</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((ex: any) => {
              const venueSlug = ex.venue?.slug?.current
              if (!venueSlug) return null
              const imgUrl = ex.images?.[0] ? urlForImage(ex.images[0]).width(800).height(600).url() : null
              return (
                <Link key={ex._id} href={`/galleries/${venueSlug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 mb-4">
                    {imgUrl && (
                      <Image src={imgUrl} alt={ex.title} width={800} height={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    {ex.venue?.name} · {ex.venue?.neighborhood} ·{' '}
                    {formatDate(ex.startDate)}{ex.endDate ? ` – ${formatDate(ex.endDate)}` : ''}
                  </p>
                  <h3 className="font-medium text-sm group-hover:underline">{ex.title}</h3>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {nextEvents.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">Upcoming events</h2>
            <Link href="/events" className="text-xs text-gray-400 hover:text-black underline">All events</Link>
          </div>
          <div className="flex flex-col gap-3">
            {nextEvents.map((ev: any) => <EventCard key={ev._id} event={ev} />)}
          </div>
        </section>
      )}
    </div>
  )
}
