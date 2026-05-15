'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm">We sent a confirmation link to {email}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
          <input type="password" placeholder="Password (min 8 chars)" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={8}
            className="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="bg-black text-white rounded py-2 text-sm">
            Create account
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an account? <Link href="/auth/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
