import { sanityClient } from '@/lib/sanity/client'
import { galleryBySlugQuery } from '@/lib/sanity/queries'
import { ExhibitionCard } from '@/components/venue/ExhibitionCard'
import { EventCard } from '@/components/events/EventCard'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await sanityClient.fetch(galleryBySlugQuery, { slug })
  if (!venue) notFound()

  const headerImg = venue.images?.[0] ? urlForImage(venue.images[0]).width(1400).height(600).url() : null

  return (
    <div>
      {headerImg && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={headerImg} alt={venue.name} width={1400} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{venue.venueType} · {venue.neighborhood}</p>
        <h1 className="text-3xl font-semibold mb-4">{venue.name}</h1>

        {venue.about && <p className="text-gray-600 mb-8 leading-relaxed">{venue.about}</p>}

        <div className="flex flex-wrap gap-4 mb-12 text-sm text-gray-500">
          {venue.address && <span>{venue.address}</span>}
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a>
          )}
        </div>

        {venue.hours?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Hours</h2>
            {venue.hours.map((h: string, i: number) => <p key={`${h}-${i}`} className="text-sm text-gray-700">{h}</p>)}
          </div>
        )}

        {venue.currentExhibitions?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Now On</h2>
            {venue.currentExhibitions.map((ex: any) => <ExhibitionCard key={ex._id} exhibition={ex} />)}
          </section>
        )}

        {venue.upcomingEvents?.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Upcoming Events</h2>
            <div className="flex flex-col gap-4">
              {venue.upcomingEvents.map((ev: any) => <EventCard key={ev._id} event={ev} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
