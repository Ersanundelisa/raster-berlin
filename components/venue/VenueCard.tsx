import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'

interface Props {
  venue: {
    _id: string
    name: string
    slug: { current: string }
    venueType: string
    neighborhood: string
    coverImage?: any
  }
}

export function VenueCard({ venue }: Props) {
  const imgUrl = venue.coverImage ? urlForImage(venue.coverImage).width(600).height(400).url() : null

  return (
    <Link href={`/galleries/${venue.slug.current}`} className="group block">
      <div className="aspect-[3/2] bg-gray-100 overflow-hidden rounded-lg mb-3">
        {imgUrl ? (
          <Image
            src={imgUrl} alt={venue.name} width={600} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{venue.venueType}</p>
      <h3 className="font-medium text-sm group-hover:underline">{venue.name}</h3>
      <p className="text-xs text-gray-500">{venue.neighborhood}</p>
    </Link>
  )
}
