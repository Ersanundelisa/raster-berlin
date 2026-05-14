'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/map', label: 'Map' },
  { href: '/galleries', label: 'Galleries' },
  { href: '/events', label: 'Events' },
  { href: '/news', label: 'News' },
  { href: '/artists', label: 'Artists' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Berlin Art Guide
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-gray-600 hover:text-black transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/account" className="text-gray-600 hover:text-black transition-colors">
            Account
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 gap-4 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 hover:text-black"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/account" className="text-gray-700 hover:text-black" onClick={() => setOpen(false)}>
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
