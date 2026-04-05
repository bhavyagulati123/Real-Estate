// ─── INVESTMENTS PAGE ────────────────────────────────────────────────────────
// app/(dashboard)/investments/page.tsx

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInvestments } from '@/hooks/useData'
import { Skeleton, StatusBadge, Button, EmptyState, KpiCard, Sheet } from '@/components/ui'
import { formatRupees, formatDate } from '@/lib/utils'
import { TrendingUp, Plus } from 'lucide-react'
import { AddInvestmentForm } from '@/components/forms'

export default function InvestmentsPage() {
  const router = useRouter()
  const { data, isLoading } = useInvestments()
  const investments = data?.data || []
  const [addOpen, setAddOpen] = useState(false)

  const holding    = investments.filter((i: any) => i.status === 'holding')
  const sold       = investments.filter((i: any) => i.status === 'sold')
  const totalValue = holding.reduce((s: number, i: any) => s + (i.myAmount || 0), 0)
  const totalProfit= sold.reduce((s: number, i: any) => s + (i.myProfit || 0), 0)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Investments</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard label="Holding"        value={holding.length}         sub={formatRupees(totalValue)} />
        <KpiCard label="Realised profit" value={formatRupees(totalProfit)} sub={`${sold.length} sold`} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}</div>
      ) : investments.length === 0 ? (
        <EmptyState icon={<TrendingUp className="w-10 h-10" />} title="No investments yet" description="Track properties you've purchased" />
      ) : (
        <div className="space-y-3">
          {investments.map((inv: any) => {
            const prop = inv.propertyId
            const holdingDays = Math.floor((Date.now() - new Date(inv.purchaseDate).getTime()) / 86400000)
            const targetGain  = inv.targetSalePrice ? inv.targetSalePrice - inv.purchasePrice : null

            return (
              <div key={inv._id} onClick={() => router.push(`/investments/${inv._id}`)} className="bg-white rounded-xl border border-zinc-200 p-4 cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-zinc-900">{prop?.title || '—'}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-zinc-500">{prop?.location}{prop?.block ? ` · Block ${prop.block}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatRupees(inv.myAmount)}</p>
                    <p className="text-xs text-zinc-400">my share ({inv.mySharePercent}%)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                  <div>
                    <p className="text-zinc-400">Purchased</p>
                    <p className="font-medium text-zinc-700">{formatDate(inv.purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">Holding</p>
                    <p className="font-medium text-zinc-700">{holdingDays}d</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">{inv.status === 'sold' ? 'Profit' : 'Target gain'}</p>
                    <p className={`font-medium tabular-nums ${inv.myProfit ? 'text-green-700' : 'text-zinc-700'}`}>
                      {inv.status === 'sold' ? formatRupees(inv.myProfit) : targetGain ? formatRupees(targetGain) : '—'}
                    </p>
                  </div>
                </div>

                {inv.coInvestors?.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-2">
                    Co-investors: {inv.coInvestors.map((c: any) => `${c.name} (${c.sharePercent}%)`).join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add investment">
        <AddInvestmentForm onClose={() => setAddOpen(false)} />
      </Sheet>
    </div>
  )
}
