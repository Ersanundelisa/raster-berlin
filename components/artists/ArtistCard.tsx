import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'

interface Props {
  artist: {
    _id: string
    name: string
    slug: { current: string }
    nationality?: string
    coverImage?: any
  }
}

export function ArtistCard({ artist }: Props) {
  const imgUrl = artist.coverImage ? urlForImage(artist.coverImage).width(400).height(400).url() : null

  return (
    <Link href={`/artists/${artist.slug.current}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
        {imgUrl ? (
          <Image src={imgUrl} alt={artist.name} width={400} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <h3 className="font-medium text-sm group-hover:underline">{artist.name}</h3>
      {artist.nationality && <p className="text-xs text-gray-400">{artist.nationality}</p>}
    </Link>
  )
}
