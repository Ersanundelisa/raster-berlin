import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'

interface Props {
  exhibition: {
    _id: string
    title: string
    slug: { current: string }
    startDate: string
    endDate?: string
    images?: any[]
    artists?: { name: string; slug: { current: string } }[]
  }
}

export function ExhibitionCard({ exhibition }: Props) {
  const imgUrl = exhibition.images?.[0] ? urlForImage(exhibition.images[0]).width(800).height(600).url() : null

  return (
    <div className="border-b border-gray-100 pb-6 mb-6">
      {imgUrl && (
        <div className="aspect-[4/3] overflow-hidden rounded-lg mb-4">
          <Image src={imgUrl} alt={exhibition.title} width={800} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="font-semibold text-base mb-1">{exhibition.title}</h3>
      {exhibition.artists && exhibition.artists.length > 0 && (
        <p className="text-sm text-gray-600 mb-1">
          {exhibition.artists.map((a, i) => (
            <span key={a.slug.current}>
              <Link href={`/artists/${a.slug.current}`} className="hover:underline">{a.name}</Link>
              {i < exhibition.artists!.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
      <p className="text-xs text-gray-400">
        {formatDate(exhibition.startDate)}{exhibition.endDate ? ` – ${formatDate(exhibition.endDate)}` : ''}
      </p>
    </div>
  )
}
