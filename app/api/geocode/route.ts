import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

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
  const query = encodeURIComponent(`${address}, Berlin, Germany`)
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=de`
  const res = await fetch(url, { headers: { 'User-Agent': 'raster-berlin-art-guide/1.0' } })
  const data = await res.json()
  if (!data[0]) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? ''
  const valid = await isValidSignature(body, signature, process.env.SANITY_WEBHOOK_SECRET!)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = JSON.parse(body)
  const { _id, _type, address } = parsed

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
