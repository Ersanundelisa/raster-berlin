'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { VenuePanel } from './VenuePanel'
import { MapFilters } from './MapFilters'

interface Venue {
  _id: string
  name: string
  slug: { current: string }
  venueType: string
  neighborhood: string
  coordinates: { lat: number; lng: number }
  hours: string[]
  currentExhibition?: { title: string; slug: { current: string } }
}

interface Props {
  venues: Venue[]
}

export function Map({ venues }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ marker: maplibregl.Marker; venue: Venue }[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [venueType, setVenueType] = useState('all')
  const [neighborhood, setNeighborhood] = useState('All')

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [13.405, 52.52],
      zoom: 12,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.current.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-left')

    venues.forEach(venue => {
      if (!venue.coordinates?.lat) return

      const el = document.createElement('div')
      el.className = 'venue-marker'
      el.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: ${venue.venueType === 'museum' ? '#1a1a1a' : '#666'};
        border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `

      const marker = new maplibregl.Marker(el)
        .setLngLat([venue.coordinates.lng, venue.coordinates.lat])
        .addTo(map.current!)

      el.addEventListener('click', () => setSelectedVenue(venue))
      markersRef.current.push({ marker, venue })
    })
  }, [venues])

  useEffect(() => {
    markersRef.current.forEach(({ marker, venue }) => {
      const typeMatch = venueType === 'all' || venue.venueType === venueType
      const neighborhoodMatch = neighborhood === 'All' || venue.neighborhood === neighborhood
      const el = marker.getElement()
      el.style.display = typeMatch && neighborhoodMatch ? 'block' : 'none'
    })
  }, [venueType, neighborhood])

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-md px-4 py-2">
        <MapFilters
          venueType={venueType} setVenueType={setVenueType}
          neighborhood={neighborhood} setNeighborhood={setNeighborhood}
        />
      </div>
      <div ref={mapContainer} className="w-full h-full" />
      <VenuePanel venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  )
}
