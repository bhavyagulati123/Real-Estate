'use client'
import { Phone, MessageCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Lead } from '@/hooks/useLeads'
import { Avatar, StatusBadge } from '@/components/ui'
import { formatRupees, getFollowUpStatus } from '@/lib/utils'

export function LeadListItem({ lead }: { lead: Lead }) {
  const router = useRouter()
  const followUpStatus = getFollowUpStatus(lead.followUpDate)

  const overdueBanner = followUpStatus?.color === 'red'
  const todayBanner = followUpStatus?.color === 'amber'

  return (
    <div
      onClick={() => router.push(`/leads/${lead._id}`)}
      className="bg-white rounded-xl border border-zinc-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
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
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            {lead.phone}
            {lead.configuration && lead.configuration !== 'NA' && ` · ${lead.configuration}`}
            {lead.block && ` · Block ${lead.block}`}
            {lead.budget && ` · ${formatRupees(lead.budget)}`}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={`tel:${lead.phone}`}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-green-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <div className="p-2 text-zinc-300">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

