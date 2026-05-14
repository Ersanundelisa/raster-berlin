import { sanityClient } from '@/lib/sanity/client'
import { mapVenuesQuery } from '@/lib/sanity/queries'
import { Map } from '@/components/map/Map'

export const revalidate = 3600

export default async function MapPage() {
  const venues = await sanityClient.fetch(mapVenuesQuery)

  return (
    <div className="h-[calc(100vh-56px)] w-full">
      <Map venues={venues} />
    </div>
  )
}
