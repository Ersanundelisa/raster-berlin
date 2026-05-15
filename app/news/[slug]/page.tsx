import { sanityClient } from '@/lib/sanity/client'
import { newsBySlugQuery } from '@/lib/sanity/queries'
import { PortableText } from '@portabletext/react'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await sanityClient.fetch(newsBySlugQuery, { slug })
  if (!article) notFound()

  const imgUrl = article.coverImage ? urlForImage(article.coverImage).width(1200).height(600).url() : null

  return (
    <div>
      {imgUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <Image src={imgUrl} alt={article.title} width={1200} height={600} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {article.tags && (
          <div className="flex gap-2 mb-4">
            {article.tags.map((t: string) => (
              <span key={t} className="text-xs text-gray-400">#{t}</span>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-semibold mb-2">{article.title}</h1>
        <p className="text-gray-400 text-sm mb-10">{formatDate(article.publishedAt)}</p>
        <div className="prose prose-sm max-w-none text-gray-800">
          <PortableText value={article.body} />
        </div>
      </div>
    </div>
  )
}
