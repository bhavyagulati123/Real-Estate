'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, Pencil } from 'lucide-react'
import { Button, Skeleton, StatusBadge, Textarea, Avatar, EmptyState } from '@/components/ui'
import { useLead, useUpdateLead } from '@/hooks/useLeads'
import { useDeals } from '@/hooks/useData'
import { FOLLOWUP_PRESETS, LEAD_STATUSES, formatDate, formatRupees, getFollowUpStatus, getPresetDate } from '@/lib/utils'
import { cn } from '@/lib/cn'
import { useUIStore } from '@/store/useUIStore'
import { useToast } from '@/components/ToastProvider'

const ACTIVE_STAGES = LEAD_STATUSES.filter(s => s !== 'new')

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const { openEditLead } = useUIStore()

  const { data, isLoading, error } = useLead(id)
  const lead = data?.data

  const update = useUpdateLead(id)
  const [followUpDate, setFollowUpDate] = useState('')
  const [stage, setStage] = useState('contacted')
  const [note, setNote] = useState('')
  const [activePreset, setActivePreset] = useState<number | null>(null)

  const { data: dealsData } = useDeals({ limit: 200 })
  const relatedDeals = useMemo(() => {
    const all = (dealsData as any)?.data ?? []
    return all.filter((d: any) => (d.buyerLeadId?._id || d.buyerLeadId) === id || (d.sellerLeadId?._id || d.sellerLeadId) === id)
  }, [dealsData, id])

  useEffect(() => {
    if (!lead) return
    const nextFollow = lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''
    setFollowUpDate(nextFollow)
    setStage(lead.status)
  }, [lead])

  const followUpStatus = getFollowUpStatus(lead?.followUpDate)
  const overdueBanner = followUpStatus?.color === 'red'
  const todayBanner = followUpStatus?.color === 'amber'

  function handlePreset(days: number) {
    setFollowUpDate(getPresetDate(days))
    setActivePreset(days)
  }

  async function handleSave() {
    if (!lead) return
    const hasChange = note.trim() || stage !== lead.status || followUpDate !== (lead.followUpDate?.split('T')[0] ?? '')
    if (!hasChange) return
    try {
      await update.mutateAsync({ followUpDate, status: stage, note: note.trim() || undefined })
      setNote('')
      toast.success('Lead saved')
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[140px]" />
        <Skeleton className="h-[220px]" />
      </div>
    )
  }

  if (!lead || error) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
        <EmptyState title="Lead not found" description="This lead may have been deleted." action={<Button onClick={() => router.push('/leads')}>Back to leads</Button>} />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Button variant="secondary" onClick={() => router.push('/leads')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Avatar name={lead.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{lead.name}</h1>
              {overdueBanner && (
                <span className="text-xs font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                  {followUpStatus?.label}
                </span>
              )}
              {todayBanner && (
                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  {followUpStatus?.label}
                </span>
              )}
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-sm text-zinc-600 mt-0.5">
              {lead.phone}
              {lead.alternatePhone && ` · alt ${lead.alternatePhone}`}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {lead.leadType.toUpperCase()}
              {lead.configuration && lead.configuration !== 'NA' && ` · ${lead.configuration}`}
              {lead.block && ` · Block ${lead.block}`}
              {lead.budget && ` · ${formatRupees(lead.budget)}`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={`tel:${lead.phone}`}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <Button variant="secondary" onClick={() => openEditLead(lead._id)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <label htmlFor="lead_followUpDate" className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2 block">
          Reschedule follow-up
        </label>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {FOLLOWUP_PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => handlePreset(p.days)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-md border transition-colors',
                activePreset === p.days
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          id="lead_followUpDate"
          name="lead_followUpDate"
          type="date"
          value={followUpDate}
          onChange={e => { setFollowUpDate(e.target.value); setActivePreset(null) }}
          autoComplete="off"
          className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
        />

        <div className="mt-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2">Move stage</p>
          <div className="flex gap-1.5 flex-wrap">
            {ACTIVE_STAGES.map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  stage === s
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : s === 'lost'
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="lead_note" className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2 block">
            Add note
          </label>
          <Textarea
            id="lead_note"
            name="lead_note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What happened on this call? What to discuss next time..."
            autoComplete="off"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-3">
          <Button onClick={handleSave} loading={update.isPending} className="flex-1">Save</Button>
          <Button variant="secondary" onClick={() => { setNote(''); setStage(lead.status); setFollowUpDate(lead.followUpDate?.split('T')[0] ?? '') }}>
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
          Interaction history ({lead.interactionHistory?.length || 0})
        </p>
        {(lead.interactionHistory?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-500">No interactions yet.</p>
        ) : (
          <div className="space-y-2">
            {lead.interactionHistory.map((entry) => (
              <div key={entry._id} className="border-l-2 border-zinc-100 pl-3 py-0.5">
                <p className="text-sm text-zinc-700">{entry.note}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {entry.stage} · {formatDate(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
          Deal activity ({relatedDeals.length})
        </p>
        {relatedDeals.length === 0 ? (
          <p className="text-sm text-zinc-500">No deals linked to this lead yet.</p>
        ) : (
          <div className="space-y-2">
            {relatedDeals.map((d: any) => (
              <div
                key={d._id}
                onClick={() => router.push(`/deals/${d._id}`)}
                className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 hover:bg-zinc-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{d.propertyId?.title || '—'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      <span className="tabular-nums">{formatRupees(d.agreedPrice)}</span> · {d.stage}
                    </p>
                  </div>
                  <StatusBadge status={d.stage} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
