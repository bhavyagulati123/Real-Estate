'use client'
import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, Plus, Pencil } from 'lucide-react'
import { useDeals, useProperty, usePropertyMatches } from '@/hooks/useData'
import { Avatar, Button, EmptyState, Skeleton, StatusBadge } from '@/components/ui'
import { formatRupees } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { openAddDeal, openEditProperty } = useUIStore()

  const { data, isLoading, error } = useProperty(id)
  const prop = data?.data as any

  const { data: matchesData, isLoading: matchesLoading } = usePropertyMatches(id)
  const matches = matchesData?.data?.matches || []

  const { data: dealsData } = useDeals({ limit: 200 })
  const relatedDeals = useMemo(() => {
    const all = (dealsData as any)?.data ?? []
    return all.filter((d: any) => (d.propertyId?._id || d.propertyId) === id)
  }, [dealsData, id])

  if (isLoading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[160px]" />
        <Skeleton className="h-[220px]" />
      </div>
    )
  }

  if (!prop || error) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
        <EmptyState title="Property not found" description="This property may have been deleted." action={<Button onClick={() => router.push('/properties')}>Back to properties</Button>} />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Button variant="secondary" onClick={() => router.push('/properties')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">{prop.title}</h1>
              <StatusBadge status={prop.ownershipStatus} />
              <StatusBadge status={prop.dealType} />
            </div>
            <p className="text-sm text-zinc-600 mt-1">
              {prop.location}{prop.block ? ` · Block ${prop.block}` : ''}
              {prop.size ? ` · ${prop.size} sq yd` : ''}
              {prop.buildingAge ? ` · ${prop.buildingAge}` : ''}
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs mt-4">
              <div>
                <p className="text-zinc-400">Listed</p>
                <p className="font-medium text-zinc-700 tabular-nums">{prop.listedPrice ? formatRupees(prop.listedPrice) : '—'}</p>
              </div>
              <div>
                <p className="text-zinc-400">Floor</p>
                <p className="font-medium text-zinc-700 tabular-nums">{prop.floorPrice ? formatRupees(prop.floorPrice) : '—'}</p>
              </div>
              <div>
                <p className="text-zinc-400">Asking</p>
                <p className="font-medium text-zinc-700 tabular-nums">{prop.askingPrice ? formatRupees(prop.askingPrice) : '—'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => openEditProperty(prop._id)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button onClick={() => openAddDeal(prop._id)}>
              <Plus className="w-4 h-4" /> Deal
            </Button>
          </div>
        </div>
      </div>

      {prop.sellerId && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">Seller</p>
          <div className="flex items-center gap-3">
            <Avatar name={prop.sellerId.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">{prop.sellerId.name}</p>
              <p className="text-xs text-zinc-500">{prop.sellerId.phone}</p>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`tel:${prop.sellerId.phone}`}
                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${String(prop.sellerId.phone).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-green-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <Button variant="secondary" onClick={() => router.push(`/leads/${prop.sellerId._id}`)}>
                View lead
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
          Matching buyers ({matches.length})
        </p>
        {matchesLoading ? (
          <Skeleton className="h-10" />
        ) : matches.length === 0 ? (
          <p className="text-sm text-zinc-500">No matching buyers in your leads.</p>
        ) : (
          <div className="space-y-2">
            {matches.map((lead: any) => (
              <div key={lead._id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                <Avatar name={lead.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900">{lead.name}</p>
                  <p className="text-xs text-zinc-500">{formatRupees(lead.budget)} budget</p>
                </div>
                <div className="flex gap-1">
                  <a href={`tel:${lead.phone}`} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Phone className="w-3.5 h-3.5" /></a>
                  <button
                    onClick={() => openAddDeal(prop._id, lead._id)}
                    className="text-xs px-2 py-1 rounded bg-zinc-900 text-white hover:opacity-90"
                  >
                    Deal
                  </button>
                </div>
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
          <p className="text-sm text-zinc-500">No deals for this property yet.</p>
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
                    <p className="text-sm font-medium text-zinc-900 truncate">{d.buyerLeadId?.name || '—'} (buyer)</p>
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

