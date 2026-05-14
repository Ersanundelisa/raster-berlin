import { sanityClient } from '@/lib/sanity/client'
import { artistBySlugQuery } from '@/lib/sanity/queries'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = await sanityClient.fetch(artistBySlugQuery, { slug })
  if (!artist) notFound()

  const headerImg = artist.images?.[0] ? urlForImage(artist.images[0]).width(1200).height(600).url() : null

  return (
    <div>
      {headerImg && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={headerImg} alt={artist.name} width={1200} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {artist.nationality && <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{artist.nationality}</p>}
        <h1 className="text-3xl font-semibold mb-2">{artist.name}</h1>
        {artist.website && (
          <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 underline mb-6 inline-block">
            {artist.website}
          </a>
        )}
        {artist.bio && <p className="text-gray-700 leading-relaxed mb-10">{artist.bio}</p>}

        {artist.linkedGalleries?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Represented by</h2>
            <div className="flex flex-wrap gap-2">
              {artist.linkedGalleries.map((g: any) => (
                <Link key={g.slug.current} href={`/galleries/${g.slug.current}`}
                  className="text-sm border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition-colors">
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {artist.currentExhibitions?.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Current Exhibitions</h2>
            {artist.currentExhibitions.map((ex: any) => (
              <div key={ex.slug.current} className="flex justify-between items-center py-3 border-b border-gray-100">
                <p className="text-sm font-medium">{ex.title}</p>
                {ex.venue?.slug?.current && (
                  <Link href={`/galleries/${ex.venue.slug.current}`} className="text-xs text-gray-400 hover:underline">
                    {ex.venue.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
