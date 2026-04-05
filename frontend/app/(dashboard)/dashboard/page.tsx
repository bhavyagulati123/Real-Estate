'use client'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Users, Briefcase } from 'lucide-react'
import { useDashboard } from '@/hooks/useData'
import { LeadListItem } from '@/components/LeadListItem'
import { KpiCard, Skeleton, EmptyState, Button } from '@/components/ui'
import { useUIStore } from '@/store/useUIStore'
import { formatRupees } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()
  const { openAddLead, openAddProperty, openAddDeal } = useUIStore()

  const d = data?.data

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{greeting}</h1>
          {d?.stats && (
            <p className="text-sm text-zinc-500 mt-1">
              {d.stats.overdueCount > 0
                ? `${d.stats.overdueCount} overdue follow-up${d.stats.overdueCount > 1 ? 's' : ''} need attention`
                : 'All follow-ups are on track'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={openAddProperty}>+ Property</Button>
          <Button size="sm" onClick={openAddLead}>+ Lead</Button>
        </div>
      </div>

      {/* KPI row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px]" />)}
        </div>
      ) : d?.stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          <KpiCard label="Active leads"    value={d.stats.totalActiveLeads}            sub={`${d.stats.overdueCount} overdue`} />
          <KpiCard label="Active deals"    value={d.stats.dealsInNegotiation + d.stats.dealsAtBayana + d.stats.dealsAtPapers} sub={`${d.stats.dealsAtBayana} at bayana`} />
          <KpiCard label="Expected"        value={formatRupees(d.stats.expectedCommissionThisMonth)} sub="commission pending" />
          <KpiCard label="Investments"     value={d.stats.investmentsHolding}           sub={formatRupees(d.stats.investmentsHoldingValue)} />
        </div>
      )}

      {/* Overdue */}
      {isLoading ? (
        <div className="space-y-3 mb-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[80px]" />)}
        </div>
      ) : (d?.overdue?.length ?? 0) > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-medium text-zinc-900">Overdue ({d!.overdue.length})</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {d!.overdue.map(lead => (
              <motion.div key={lead._id} variants={staggerItem}>
                <LeadListItem lead={lead} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Due today */}
      {(d?.dueToday?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-900 mb-3">Due today ({d!.dueToday.length})</h2>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {d!.dueToday.map(lead => (
              <motion.div key={lead._id} variants={staggerItem}>
                <LeadListItem lead={lead} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Active deals summary */}
      {(d?.activeDeals?.length ?? 0) > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-900">Active deals ({d!.activeDeals.length})</h2>
            <Button size="sm" variant="ghost" onClick={() => openAddDeal()}>+ Deal</Button>
          </div>
          <div className="space-y-2">
            {d!.activeDeals.map(deal => {
              const prop   = deal.propertyId as any
              const buyer  = deal.buyerLeadId as any
              return (
                <div key={deal._id} className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{prop?.title || '—'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{buyer?.name} · {deal.stage}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatRupees(deal.agreedPrice)}</p>
                    {deal.riskLevel === 'high' && (
                      <p className="text-xs text-red-600">high risk</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {(d?.upcoming?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 mb-3">Upcoming ({d!.upcoming.length})</h2>
          <div className="space-y-2">
            {d!.upcoming.map(lead => (
              <div key={lead._id} className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{lead.name}</p>
                  <p className="text-xs text-zinc-500">{lead.phone}</p>
                </div>
                <p className="text-xs text-zinc-400">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && !d?.overdue?.length && !d?.dueToday?.length && !d?.activeDeals?.length && (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="No follow-ups today"
          description="Add your first lead to get started"
          action={<Button onClick={openAddLead}><Plus className="w-4 h-4" /> Add lead</Button>}
        />
      )}
    </div>
  )
}
