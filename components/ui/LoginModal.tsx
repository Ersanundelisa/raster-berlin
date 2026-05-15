'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.refresh()
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1"><X size={18} /></button>
        <h2 className="text-lg font-semibold mb-4">Sign in to continue</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-black text-white rounded py-2 text-sm disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-400 text-center">
          No account? <a href="/auth/signup" className="underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}
