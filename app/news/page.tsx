import { sanityClient } from '@/lib/sanity/client'
import { newsListQuery } from '@/lib/sanity/queries'
import { NewsCard } from '@/components/news/NewsCard'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const articles = await sanityClient.fetch(newsListQuery)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold mb-10">News</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {articles.map((a: any) => <NewsCard key={a._id} article={a} />)}
      </div>
    </div>
  )
}
