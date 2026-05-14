import { sanityClient } from '@/lib/sanity/client'
import { artistListQuery } from '@/lib/sanity/queries'
import { ArtistCard } from '@/components/artists/ArtistCard'

export const revalidate = 3600

export default async function ArtistsPage() {
  const artists = await sanityClient.fetch(artistListQuery)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-10">Artists</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {artists.map((a: any) => <ArtistCard key={a._id} artist={a} />)}
      </div>
    </div>
  )
}
