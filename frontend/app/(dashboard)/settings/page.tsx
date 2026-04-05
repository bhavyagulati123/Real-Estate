'use client'
import { useState } from 'react'
import { User, KeyRound, Users, Phone, Plus, Pencil } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAgents, useAddAgent, useEditAgent } from '@/hooks/useData'
import { api } from '@/lib/api'
import { Input, Button, Label, ErrorMsg } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import type { Agent } from '@/hooks/useData'

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
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label><span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</span></Label>
          <Input value={user?.phone || ''} disabled className="opacity-60 cursor-not-allowed" />
          <p className="text-[11px] text-zinc-400 mt-1">Phone number cannot be changed.</p>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-700">Change password</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Current password</Label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </div>

        {error && <ErrorMsg message={error} />}

        <Button type="submit" loading={loading} size="sm">Save changes</Button>
      </form>
    </section>
  )
}

// ─── AGENT ROW ───────────────────────────────────────────────────────────────
function AgentRow({ agent }: { agent: Agent }) {
  const toast = useToast()
  const edit  = useEditAgent(agent._id)
  const [open, setOpen]   = useState(false)
  const [name, setName]   = useState(agent.name)
  const [phone, setPhone] = useState(agent.phone || '')
  const [notes, setNotes] = useState(agent.notes || '')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await edit.mutateAsync({ name, phone, notes })
      toast.success('Agent updated')
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="border border-zinc-200 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">{agent.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {agent.phone || 'No phone'} · <span className="capitalize">{agent.type}</span>
            {agent.totalDeals ? ` · ${agent.totalDeals} deals` : ''}
          </p>
        </div>
        <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="mt-3 pt-3 border-t border-zinc-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={edit.isPending}>Save</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── AGENTS SECTION ──────────────────────────────────────────────────────────
function AgentsSection() {
  const toast   = useToast()
  const addAgent = useAddAgent()
  const { data } = useAgents()
  const agents   = data?.data || []

  const [showForm, setShowForm] = useState(false)
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType]   = useState<'internal' | 'external'>('external')
  const [notes, setNotes] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addAgent.mutateAsync({ name, phone, type, notes })
      toast.success('Agent added')
      setName(''); setPhone(''); setNotes(''); setShowForm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  const internal = agents.filter(a => a.type === 'internal')
  const external = agents.filter(a => a.type === 'external')

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900">Agents</h2>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(o => !o)}>
          <Plus className="w-3.5 h-3.5" /> Add agent
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-5 p-4 bg-zinc-50 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Type *</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'internal' | 'external')}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="external">External</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={addAgent.isPending}>Add</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {agents.length === 0 ? (
        <p className="text-sm text-zinc-400">No agents yet.</p>
      ) : (
        <div className="space-y-4">
          {internal.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Internal</p>
              <div className="space-y-2">{internal.map(a => <AgentRow key={a._id} agent={a} />)}</div>
            </div>
          )}
          {external.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">External</p>
              <div className="space-y-2">{external.map(a => <AgentRow key={a._id} agent={a} />)}</div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-6">Settings</h1>
      <div className="space-y-5">
        <ProfileSection />
        <AgentsSection />
      </div>
    </div>
  )
}
