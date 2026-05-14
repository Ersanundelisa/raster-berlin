'use client'

interface Props {
  venueType: string
  setVenueType: (v: string) => void
  neighborhood: string
  setNeighborhood: (v: string) => void
}

const neighborhoods = ['All', 'Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln', 'Wedding', 'Tiergarten']

export function MapFilters({ venueType, setVenueType, neighborhood, setNeighborhood }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {['all', 'gallery', 'museum'].map(t => (
        <button
          key={t}
          onClick={() => setVenueType(t)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${venueType === t ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
        >
          {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
      <span className="w-px bg-gray-200 mx-1" />
      <select
        value={neighborhood}
        onChange={e => setNeighborhood(e.target.value)}
        className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-700"
      >
        {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}
