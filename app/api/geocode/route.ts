import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

function getWriteClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN!,
    useCdn: false,
  })
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Berlin, Germany')}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results[0]) return null
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('sanity-webhook-signature') ?? ''
  if (signature !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { _id, _type, address } = body

  if (_type !== 'gallery' || !address) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const coords = await geocodeAddress(address)
  if (!coords) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 422 })
  }

  await getWriteClient().patch(_id).set({ coordinates: coords }).commit()

  return NextResponse.json({ ok: true, coords })
}
