import Link from 'next/link'
import { X } from 'lucide-react'

interface Venue {
  _id: string
  name: string
  slug: { current: string }
  venueType: string
  neighborhood: string
  hours: string[]
  currentExhibition?: { title: string; slug: { current: string } }
}

interface Props {
  venue: Venue | null
  onClose: () => void
}

export function VenuePanel({ venue, onClose }: Props) {
  if (!venue) return null

  return (
    <>
      {/* Desktop: side panel */}
      <div className="hidden md:flex absolute top-0 right-0 h-full w-80 bg-white shadow-xl z-10 flex-col p-6 overflow-y-auto">
        <PanelContent venue={venue} onClose={onClose} />
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-10 p-5 max-h-[60vh] overflow-y-auto">
        <PanelContent venue={venue} onClose={onClose} />
      </div>
    </>
  )
}

function PanelContent({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  return (
    <>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{venue.venueType}</span>
        <button onClick={onClose} className="p-1 -mr-1"><X size={16} /></button>
      </div>
      <h2 className="text-lg font-semibold mb-1">{venue.name}</h2>
      <p className="text-sm text-gray-500 mb-3">{venue.neighborhood}</p>
      {venue.currentExhibition && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Now on</p>
          <Link
            href={`/galleries/${venue.slug.current}`}
            className="text-sm font-medium hover:underline"
          >
            {venue.currentExhibition.title}
          </Link>
        </div>
      )}
      {venue.hours?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Hours</p>
          {venue.hours.map((h, i) => <p key={i} className="text-sm text-gray-700">{h}</p>)}
        </div>
      )}
      <Link
        href={`/galleries/${venue.slug.current}`}
        className="block w-full text-center bg-black text-white rounded-lg py-2 text-sm"
      >
        View gallery
      </Link>
    </>
  )
}
