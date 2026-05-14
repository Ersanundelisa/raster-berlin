import { sanityClient } from '@/lib/sanity/client'
import { galleryListQuery } from '@/lib/sanity/queries'
import { VenueCard } from '@/components/venue/VenueCard'

export const revalidate = 3600

export default async function GalleriesPage() {
  const venues = await sanityClient.fetch(galleryListQuery)
  const galleries = venues.filter((v: any) => v.venueType === 'gallery')
  const museums = venues.filter((v: any) => v.venueType === 'museum')

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {museums.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Museums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {museums.map((v: any) => <VenueCard key={v._id} venue={v} />)}
          </div>
        </section>
      )}
      {galleries.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Galleries</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleries.map((v: any) => <VenueCard key={v._id} venue={v} />)}
          </div>
        </section>
      )}
    </div>
  )
}
