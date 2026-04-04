'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar, StatusBadge, Button, Textarea } from './ui'
import { useUpdateLead } from '@/hooks/useLeads'
import type { Lead } from '@/hooks/useLeads'
import { cn } from '@/lib/cn'
import { formatRupees, formatDate, getFollowUpStatus, getPresetDate } from '@/lib/utils'
import { FOLLOWUP_PRESETS, LEAD_STATUSES } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'

const ACTIVE_STAGES = LEAD_STATUSES.filter(s => s !== 'new')

interface LeadCardProps {
  lead:        Lead
  compact?:    boolean  // minimal view for dashboard lists
  onSaved?:    () => void
}

export function LeadCard({ lead, compact = false, onSaved }: LeadCardProps) {
  const [expanded,      setExpanded]      = useState(!compact)
  const [followUpDate,  setFollowUpDate]  = useState(
    lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''
  )
  const [stage,         setStage]         = useState(lead.status)
  const [note,          setNote]          = useState('')
  const [activePreset,  setActivePreset]  = useState<number | null>(null)
  const [showHistory,   setShowHistory]   = useState(false)

  const update = useUpdateLead(lead._id)
  const { openEditLead } = useUIStore()

  const followUpStatus = getFollowUpStatus(lead.followUpDate)

  function handlePreset(days: number) {
    setFollowUpDate(getPresetDate(days))
    setActivePreset(days)
  }

  async function handleSave() {
    const hasChange = note.trim() || stage !== lead.status || followUpDate !== (lead.followUpDate?.split('T')[0] ?? '')
    if (!hasChange) return
    try {
      await update.mutateAsync({ followUpDate, status: stage, note: note.trim() || undefined })
      setNote('')
      onSaved?.()
    } catch {/* error handled by mutation */ }
  }

  const overdueBanner = followUpStatus?.color === 'red'
  const todayBanner   = followUpStatus?.color === 'amber'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">

      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <Avatar name={lead.name} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-900">{lead.name}</span>
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
            <StatusBadge status={stage} />
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {lead.phone}
            {lead.configuration && lead.configuration !== 'NA' && ` · ${lead.configuration}`}
            {lead.block && ` · Block ${lead.block}`}
            {lead.budget && ` · ${formatRupees(lead.budget)}`}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Quick call / WhatsApp */}
          <a href={`tel:${lead.phone}`}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Phone className="w-4 h-4" />
          </a>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
            target="_blank" rel="noreferrer"
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-green-600 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          {compact && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {(overdueBanner || todayBanner) && (
        <div className={cn(
          'mx-4 mb-3 px-3 py-2 rounded-lg text-xs',
          overdueBanner ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        )}>
          {overdueBanner
            ? `Follow-up overdue — call ${lead.name.split(' ')[0]} today`
            : `Follow-up due today`}
        </div>
      )}

      {/* Expandable action section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-100 pt-4">

          {/* Reschedule follow-up */}
          <div>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
              Reschedule follow-up
            </p>
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
              type="date"
              value={followUpDate}
              onChange={e => { setFollowUpDate(e.target.value); setActivePreset(null) }}
              className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
            />
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2">Add note</p>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What happened on this call? What to discuss next time..."
              rows={2}
            />
          </div>

          {/* Stage pills */}
          <div>
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

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              loading={update.isPending}
              className="flex-1"
            >
              Save changes
            </Button>
            <Button
              variant="secondary"
              onClick={() => openEditLead(lead._id)}
            >
              Edit
            </Button>
          </div>

          {/* Interaction history */}
          {lead.interactionHistory?.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(p => !p)}
                className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-widest"
              >
                History ({lead.interactionHistory.length})
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2">
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
          )}
        </div>
      )}
    </div>
  )
}
