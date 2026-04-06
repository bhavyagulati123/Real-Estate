'use client'
import { useState } from 'react'
import { User, KeyRound, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'
import { Input, Button, Label, ErrorMsg } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'

// ─── PROFILE SECTION ─────────────────────────────────────────────────────────
function ProfileSection() {
  const { user } = useAuthStore()
  const toast = useToast()
  const [name, setName]               = useState(user?.name || '')
  const [currentPw, setCurrentPw]     = useState('')
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPw && newPw !== confirmPw) { setError('New passwords do not match'); return }
    if (newPw && newPw.length < 6)    { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const body: Record<string, string> = {}
      if (name.trim() !== user?.name) body.name = name.trim()
      if (newPw) { body.currentPassword = currentPw; body.newPassword = newPw }
      if (!Object.keys(body).length) { toast.success('Nothing to update'); setLoading(false); return }

      const res = await api.patch<{ success: boolean; data: { name: string; role: string; phone: string; _id: string } }>(
        '/api/auth/me', body
      )
      useAuthStore.setState({ user: res.data })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast.success('Profile updated')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <User className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900">Profile</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <Label htmlFor="profile_name">Name</Label>
          <Input id="profile_name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="profile_phone"><span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</span></Label>
          <Input id="profile_phone" name="phone" autoComplete="tel" value={user?.phone || ''} disabled className="opacity-60 cursor-not-allowed" />
          <p className="text-[11px] text-zinc-400 mt-1">Phone number cannot be changed.</p>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-700">Change password</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="profile_currentPassword">Current password</Label>
              <Input id="profile_currentPassword" name="currentPassword" type="password" autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="profile_newPassword">New password</Label>
              <Input id="profile_newPassword" name="newPassword" type="password" autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="profile_confirmPassword">Confirm new password</Label>
              <Input id="profile_confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </div>

        {error && <ErrorMsg message={error} />}

        <Button type="submit" loading={loading} size="sm">Save changes</Button>
      </form>
    </section>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-6">Settings</h1>
      <ProfileSection />
    </div>
  )
}
