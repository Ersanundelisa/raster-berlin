import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'

interface Props {
  article: {
    _id: string
    title: string
    slug: { current: string }
    publishedAt: string
    tags?: string[]
    coverImage?: any
  }
}

export function NewsCard({ article }: Props) {
  const imgUrl = article.coverImage ? urlForImage(article.coverImage).width(600).height(400).url() : null

  return (
    <Link href={`/news/${article.slug.current}`} className="group block">
      {imgUrl && (
        <div className="aspect-[3/2] overflow-hidden rounded-lg mb-3">
          <Image src={imgUrl} alt={article.title} width={600} height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {article.tags && (
        <div className="flex gap-1 flex-wrap mb-2">
          {article.tags.map(t => (
            <span key={t} className="text-xs text-gray-400">#{t}</span>
          ))}
        </div>
      )}
      <h3 className="font-medium text-sm group-hover:underline mb-1">{article.title}</h3>
      <p className="text-xs text-gray-400">{formatDate(article.publishedAt)}</p>
    </Link>
  )
}
