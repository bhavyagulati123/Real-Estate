'use client'

import { useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { StatusBadge } from '@/components/StatusBadge'
import { FOLLOWUP_PRESETS, LEAD_STATUSES } from '@/lib/constants'
import { formatRupees, formatShortDate, getFollowUpStatus, toInputDate } from '@/lib/format'

function getPresetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function LeadCard({ lead, onSave }) {
  const [followUpDate, setFollowUpDate] = useState(toInputDate(lead.followUpDate))
  const [status, setStatus] = useState(lead.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const followUpState = getFollowUpStatus(lead.followUpDate)

  async function handleSave() {
    setSaving(true)

    const payload = {
      followUpDate,
      status,
      note
    }

    await new Promise((resolve) => setTimeout(resolve, 300))
    setNote('')
    setSaving(false)
    onSave?.(payload)
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar name={lead.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
            {followUpState ? (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${followUpState.className}`}>
                {followUpState.label}
              </span>
            ) : null}
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {lead.phone} · {lead.leadType} · {lead.configuration || lead.propertyType} · Block {lead.block}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Budget</p>
          <p className="text-sm font-medium text-gray-900">{formatRupees(lead.budget)}</p>
        </div>
      </div>

      {followUpState?.type === 'overdue' ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Follow-up pending since {formatShortDate(lead.followUpDate)}
        </div>
      ) : null}

      <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
            Reschedule follow-up
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {FOLLOWUP_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setFollowUpDate(getPresetDate(preset.days))}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={followUpDate}
            onChange={(event) => setFollowUpDate(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-600"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Add note</p>
          <textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What happened on this call? What next?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Move stage</p>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_STATUSES.filter((item) => item !== 'new').map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setStatus(stage)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  status === stage
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </article>
  )
}
