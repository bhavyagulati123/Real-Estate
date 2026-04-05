'use client'
import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, DollarSign, Flag, CheckCircle2 } from 'lucide-react'
import { useAdvanceDealStage, useCloseDeal, useDeal, useLostDeal } from '@/hooks/useData'
import { Avatar, Button, EmptyState, Skeleton, StatusBadge, Textarea, Input } from '@/components/ui'
import { formatDate, formatRupees, DEAL_STAGES } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { useToast } from '@/components/ToastProvider'

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const { openAddPayment } = useUIStore()

  const { data, isLoading, error } = useDeal(id)
  const deal = data?.data as any

  const closeDeal = useCloseDeal(id)
  const lostDeal = useLostDeal(id)
  const advanceStage = useAdvanceDealStage(id)

  const [closeDate, setCloseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [lostReason, setLostReason] = useState('')
  const [stageNotes, setStageNotes] = useState('')

  const prop = deal?.propertyId
  const buyer = deal?.buyerLeadId
  const seller = deal?.sellerLeadId

  const pctPaid = useMemo(() => {
    if (!deal?.agreedPrice) return 0
    return Math.min(100, Math.round((deal.totalPaid / deal.agreedPrice) * 100))
  }, [deal])

  async function handleAdvance(nextStage: string) {
    try {
      await advanceStage.mutateAsync({ stage: nextStage, notes: stageNotes.trim() || undefined })
      setStageNotes('')
      toast.success(`Moved to ${nextStage}`)
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  async function handleClose() {
    try {
      await closeDeal.mutateAsync({ closedDate: closeDate || undefined })
      toast.success('Deal closed')
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  async function handleLost() {
    if (!lostReason.trim()) return toast.error('Lost reason is required')
    try {
      await lostDeal.mutateAsync({ lostReason: lostReason.trim() })
      toast.success('Deal marked lost')
    } catch (e) {
      toast.error((e as Error).message || 'Something went wrong')
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-[260px]" />
      </div>
    )
  }

  if (!deal || error) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
        <EmptyState title="Deal not found" description="This deal may have been deleted." action={<Button onClick={() => router.push('/deals')}>Back to deals</Button>} />
      </div>
    )
  }

  const isFinal = ['closed', 'lost'].includes(deal.stage)
  const nextStage = (() => {
    const idx = DEAL_STAGES.indexOf(deal.stage)
    if (idx === -1) return null
    return DEAL_STAGES[idx + 1] || null
  })()

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Button variant="secondary" onClick={() => router.push('/deals')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">{prop?.title || '—'}</h1>
              <StatusBadge status={deal.stage} />
              {deal.riskLevel === 'high' && (
                <span className="flex items-center gap-0.5 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" /> high risk
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600">
              {prop?.location}{prop?.block ? ` · Block ${prop.block}` : ''}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              <span className="tabular-nums">{formatRupees(deal.agreedPrice)}</span>
              {deal.expectedCommission ? ` · ${formatRupees(deal.expectedCommission)} expected commission` : ''}
            </p>
          </div>

          {!isFinal && (
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="secondary" onClick={() => openAddPayment(deal._id)}>
                <DollarSign className="w-4 h-4" /> Payment
              </Button>
              {nextStage && (
                <Button onClick={() => handleAdvance(nextStage)} loading={advanceStage.isPending}>
                  Advance
                </Button>
              )}
            </div>
          )}
        </div>

        {!isFinal && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{formatRupees(deal.totalPaid)} paid</span>
              <span>{formatRupees(deal.remainingAmount)} remaining</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${pctPaid}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Parties</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-3">
            <p className="text-xs text-zinc-400 mb-2">Buyer</p>
            {buyer ? (
              <div className="flex items-center gap-2">
                <Avatar name={buyer.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{buyer.name}</p>
                  <p className="text-xs text-zinc-500">{buyer.phone}</p>
                </div>
                <Button variant="secondary" onClick={() => router.push(`/leads/${buyer._id}`)}>View</Button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <p className="text-xs text-zinc-400 mb-2">Seller</p>
            {seller ? (
              <div className="flex items-center gap-2">
                <Avatar name={seller.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{seller.name}</p>
                  <p className="text-xs text-zinc-500">{seller.phone}</p>
                </div>
                <Button variant="secondary" onClick={() => router.push(`/leads/${seller._id}`)}>View</Button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
          </div>
        </div>
      </div>

      {!isFinal && nextStage && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
            Advance stage ({deal.stage} → {nextStage})
          </p>
          <Textarea value={stageNotes} onChange={(e) => setStageNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
          <div className="flex gap-2 pt-3">
            <Button onClick={() => handleAdvance(nextStage)} loading={advanceStage.isPending} className="flex-1">
              Advance to {nextStage}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
          Payments ({deal.payments?.length || 0})
        </p>
        {(deal.payments?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-500">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {deal.payments.map((p: any) => (
              <div key={p._id} className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {p.type}
                    {!p.verified && p.type === 'commission' && <span className="text-xs text-zinc-400"> · unverified</span>}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatDate(p.date)}
                    {p.paidBy ? ` · paid by ${p.paidBy}` : ''}
                    {p.receivedBy ? ` · received by ${p.receivedBy}` : ''}
                  </p>
                  {p.notes && <p className="text-xs text-zinc-500 mt-1">{p.notes}</p>}
                </div>
                <p className={`text-sm font-semibold tabular-nums ${p.type === 'commission' ? 'text-green-700' : 'text-zinc-900'}`}>
                  {formatRupees(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Stage history</p>
        {(deal.stageHistory?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-500">No stage history.</p>
        ) : (
          <div className="space-y-2">
            {deal.stageHistory.map((h: any, idx: number) => (
              <div key={`${h.stage}_${h.date}_${idx}`} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{h.stage}</p>
                  <p className="text-xs text-zinc-500">{formatDate(h.date)}</p>
                  {h.notes && <p className="text-xs text-zinc-500 mt-1">{h.notes}</p>}
                </div>
                <StatusBadge status={h.stage} />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isFinal ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Close deal</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Closed date</p>
                <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
              <Button onClick={handleClose} loading={closeDeal.isPending} className="w-full">
                <CheckCircle2 className="w-4 h-4" /> Mark closed
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Mark lost</p>
            <Textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} rows={2} placeholder="Why did this deal fail?" />
            <div className="pt-3">
              <Button variant="secondary" onClick={handleLost} loading={lostDeal.isPending} className="w-full">
                <Flag className="w-4 h-4" /> Mark lost
              </Button>
            </div>
          </div>
        </div>
      ) : deal.stage === 'lost' ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-sm text-zinc-700">Lost reason</p>
          <p className="text-sm text-zinc-500 mt-1">{deal.lostReason || '—'}</p>
        </div>
      ) : null}
    </div>
  )
}

