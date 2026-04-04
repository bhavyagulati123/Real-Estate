'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertTriangle, DollarSign } from 'lucide-react'
import { useDeals } from '@/hooks/useData'
import { StatusBadge, Skeleton, Button, EmptyState } from '@/components/ui'
import { useUIStore } from '@/store/useUIStore'
import { formatRupees, formatDate } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { DEAL_STAGES } from '@/lib/utils'

export default function DealsPage() {
  const { openAddDeal, openAddPayment } = useUIStore()
  const [stageFilter, setStageFilter]   = useState('')

  const { data, isLoading } = useDeals(stageFilter ? { stage: stageFilter } : {})
  const deals = data?.data || []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Deals</h1>
        <Button size="sm" onClick={openAddDeal}><Plus className="w-4 h-4" /> New deal</Button>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {['', ...DEAL_STAGES].map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              stageFilter === s
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Create a deal when a buyer is interested in a property"
          action={<Button onClick={openAddDeal}><Plus className="w-4 h-4" /> New deal</Button>}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {deals.map((deal: any) => {
            const prop   = deal.propertyId
            const buyer  = deal.buyerLeadId
            const seller = deal.sellerLeadId
            const pctPaid = deal.agreedPrice > 0 ? Math.round((deal.totalPaid / deal.agreedPrice) * 100) : 0

            return (
              <motion.div key={deal._id} variants={staggerItem}>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-zinc-900">{prop?.title || '—'}</span>
                        <StatusBadge status={deal.stage} />
                        {deal.riskLevel === 'high' && (
                          <span className="flex items-center gap-0.5 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" /> high risk
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {buyer?.name} (buyer) · {seller?.name} (seller)
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatRupees(deal.agreedPrice)}</p>
                      {deal.expectedCommission && (
                        <p className="text-xs text-zinc-400">{formatRupees(deal.expectedCommission)} commission</p>
                      )}
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  {deal.stage !== 'lost' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>{formatRupees(deal.totalPaid)} paid</span>
                        <span>{formatRupees(deal.remainingAmount)} remaining</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Recent payments */}
                  {deal.payments?.length > 0 && (
                    <div className="mb-3">
                      {deal.payments.slice(-2).map((p: any) => (
                        <div key={p._id} className="flex justify-between text-xs py-0.5">
                          <span className="text-zinc-500">{p.type} · {formatDate(p.date)}</span>
                          <span className={`font-medium tabular-nums ${p.type === 'commission' ? 'text-green-700' : 'text-zinc-700'}`}>
                            {formatRupees(p.amount)}
                            {!p.verified && p.type === 'commission' && ' (unverified)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {!['closed','lost'].includes(deal.stage) && (
                    <div className="flex gap-2 pt-1 border-t border-zinc-100">
                      <button
                        onClick={() => openAddPayment(deal._id)}
                        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors py-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Add payment
                      </button>
                    </div>
                  )}

                  {deal.lostReason && (
                    <p className="text-xs text-zinc-400 mt-2 italic">Lost: {deal.lostReason}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
