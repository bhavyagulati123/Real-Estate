'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { useInvestment, useSellInvestment } from '@/hooks/useData'
import { Button, Skeleton, StatusBadge, Input, EmptyState } from '@/components/ui'
import { formatRupees, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ToastProvider'

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const toast   = useToast()

  const { data, isLoading, error } = useInvestment(id)
  const inv  = data?.data as any
  const prop = inv?.propertyId as any

  const sell = useSellInvestment(id)
  const [salePrice, setSalePrice] = useState('')
  const [saleDate,  setSaleDate]  = useState(() => new Date().toISOString().split('T')[0])
  const [showSellForm, setShowSellForm] = useState(false)

  async function handleSell(e: React.FormEvent) {
    e.preventDefault()
    if (!salePrice || Number(salePrice) <= 0) return toast.error('Enter a valid sale price')
    try {
      await sell.mutateAsync({ actualSalePrice: Number(salePrice), saleDate })
      toast.success('Investment marked as sold')
      setShowSellForm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-[140px]" />
      </div>
    )
  }

  if (!inv || error) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
        <EmptyState
          title="Investment not found"
          description="This investment may have been deleted."
          action={<Button onClick={() => router.push('/investments')}>Back to investments</Button>}
        />
      </div>
    )
  }

  const holdingDays   = Math.floor((Date.now() - new Date(inv.purchaseDate).getTime()) / 86400000)
  const isSold        = inv.status === 'sold'
  const previewProfit = salePrice
    ? Math.round(Number(salePrice) * (inv.mySharePercent / 100) - inv.myAmount - (inv.holdingCosts || 0) * (inv.mySharePercent / 100))
    : null

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Button variant="secondary" onClick={() => router.push('/investments')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">
                {prop?.title || '—'}
              </h1>
              <StatusBadge status={inv.status} />
            </div>
            <p className="text-sm text-zinc-500">
              {prop?.location}{prop?.block ? ` · Block ${prop.block}` : ''}
            </p>
          </div>
          {!isSold && (
            <Button onClick={() => setShowSellForm(o => !o)}>
              <CheckCircle2 className="w-4 h-4" /> Mark sold
            </Button>
          )}
        </div>
      </div>

      {/* Mark sold form */}
      {!isSold && showSellForm && (
        <form onSubmit={handleSell} className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 space-y-3">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Record sale</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Actual sale price (₹) *</p>
              <Input
                type="number"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                placeholder="e.g. 5000000"
                required
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Sale date</p>
              <Input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
            </div>
          </div>

          {previewProfit !== null && (() => {
            const grossPrev  = Math.round(Number(salePrice) * (inv.mySharePercent / 100))
            const holdingPrev = Math.round((inv.holdingCosts || 0) * (inv.mySharePercent / 100))
            return (
              <div className={`rounded-lg px-4 py-3 space-y-1 ${previewProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {previewProfit >= 0
                    ? <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />}
                  <p className="text-xs font-medium text-zinc-600">Your {inv.mySharePercent}% share breakdown</p>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{inv.mySharePercent}% of {formatRupees(Number(salePrice))}</span>
                  <span>{formatRupees(grossPrev)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Less your investment</span>
                  <span>− {formatRupees(inv.myAmount)}</span>
                </div>
                {holdingPrev > 0 && (
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Less holding costs share</span>
                    <span>− {formatRupees(holdingPrev)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-green-200">
                  <span className="text-xs font-semibold text-zinc-900">Your net profit</span>
                  <span className={`text-sm font-bold tabular-nums ${previewProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatRupees(previewProfit)}
                  </span>
                </div>
              </div>
            )
          })()}

          <div className="flex gap-2">
            <Button type="submit" loading={sell.isPending} className="flex-1">Confirm sale</Button>
            <Button type="button" variant="secondary" onClick={() => setShowSellForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Investment details */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Investment details</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Purchase price</p>
            <p className="font-medium tabular-nums text-zinc-900">{formatRupees(inv.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">My share</p>
            <p className="font-medium text-zinc-900">{inv.mySharePercent}% · {formatRupees(inv.myAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Purchase date</p>
            <p className="font-medium text-zinc-900">{formatDate(inv.purchaseDate)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">{isSold ? 'Held for' : 'Holding for'}</p>
            <p className="font-medium text-zinc-900">{holdingDays} days</p>
          </div>
          {inv.holdingCosts > 0 && (
            <div>
              <p className="text-xs text-zinc-400">Holding costs</p>
              <p className="font-medium tabular-nums text-zinc-900">{formatRupees(inv.holdingCosts)}</p>
            </div>
          )}
          {inv.targetSalePrice && !isSold && (
            <div>
              <p className="text-xs text-zinc-400">Target sale price</p>
              <p className="font-medium tabular-nums text-zinc-900">{formatRupees(inv.targetSalePrice)}</p>
            </div>
          )}
        </div>
        {inv.notes && <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-100">{inv.notes}</p>}
      </div>

      {/* Sold info */}
      {isSold && (() => {
        const grossMyProceeds = Math.round(inv.actualSalePrice * (inv.mySharePercent / 100))
        const myHoldingShare  = Math.round((inv.holdingCosts || 0) * (inv.mySharePercent / 100))
        return (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-4">
            <p className="text-[10px] font-medium text-green-600 uppercase tracking-widest mb-3">Sale result</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
              <div>
                <p className="text-xs text-green-600">Actual sale price (total)</p>
                <p className="font-medium tabular-nums text-zinc-900">{formatRupees(inv.actualSalePrice)}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Sale date</p>
                <p className="font-medium text-zinc-900">{formatDate(inv.saleDate)}</p>
              </div>
            </div>

            {/* Profit breakdown */}
            <div className="border-t border-green-200 pt-3 space-y-1.5">
              <p className="text-[10px] font-medium text-green-600 uppercase tracking-widest mb-2">Your profit breakdown ({inv.mySharePercent}% share)</p>
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Your {inv.mySharePercent}% of sale ({formatRupees(inv.actualSalePrice)})</span>
                <span className="tabular-nums font-medium">{formatRupees(grossMyProceeds)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Less your investment</span>
                <span className="tabular-nums">− {formatRupees(inv.myAmount)}</span>
              </div>
              {myHoldingShare > 0 && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Less your holding costs ({inv.mySharePercent}%)</span>
                  <span className="tabular-nums">− {formatRupees(myHoldingShare)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-green-200">
                <span className="text-sm font-semibold text-zinc-900">Your net profit</span>
                <span className={`text-sm font-bold tabular-nums ${inv.myProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {formatRupees(inv.myProfit)}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Co-investors */}
      {inv.coInvestors?.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
            Co-investors ({inv.coInvestors.length})
          </p>
          <div className="space-y-2">
            {inv.coInvestors.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                  {c.phone && <p className="text-xs text-zinc-400">{c.phone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatRupees(c.amountInvested)}</p>
                  <p className="text-xs text-zinc-400">{c.sharePercent}% share</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
