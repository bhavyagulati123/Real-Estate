'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Input, Button, Label, ErrorMsg } from '@/components/ui'

export default function LoginPage() {
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await login(phone, password)
      router.push('/dashboard')
    } catch { /* error shown from store */ }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900 leading-none">SK Properties</p>
            <p className="text-xs text-zinc-400 mt-0.5">Mohan Garden, Delhi</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h1 className="text-lg font-semibold text-zinc-900 mb-1">Sign in</h1>
          <p className="text-sm text-zinc-500 mb-5">Enter your phone and password</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98110 00000"
                autoComplete="tel"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" loading={isLoading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">SK Properties CRM · Mohan Garden</p>
      </div>
    </div>
  )
}
