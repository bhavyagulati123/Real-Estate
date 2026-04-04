'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Phone, MessageCircle, Building2 } from 'lucide-react'
import { useProperties, usePropertyMatches } from '@/hooks/useData'
import { Skeleton, StatusBadge, Button, EmptyState, Select, Sheet, KpiCard } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { useUIStore } from '@/store/useUIStore'
import { formatRupees, formatDate, BLOCKS } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function PropertiesPage() {
  const { propertiesFilter, setPropertiesFilter, openAddProperty, openAddDeal } = useUIStore()
  const [search, setSearch]           = useState('')
  const [selectedId, setSelectedId]   = useState<string | null>(null)

  const filters = { ...propertiesFilter, search: search || undefined, limit: 50 }
  const { data, isLoading } = useProperties(filters)
  const properties = data?.data || []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Properties</h1>
        <Button size="sm" onClick={openAddProperty}><Plus className="w-4 h-4" /> Add property</Button>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 bg-white text-sm placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['', 'available', 'underNegotiation', 'sold', 'ownerOwned'].map(s => (
          <button
            key={s}
            onClick={() => setPropertiesFilter({ ownershipStatus: s || undefined })}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              (propertiesFilter.ownershipStatus || '') === s
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
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-10 h-10" />}
          title="No properties found"
          action={<Button onClick={openAddProperty}><Plus className="w-4 h-4" /> Add property</Button>}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {properties.map((prop: any) => (
            <motion.div key={prop._id} variants={staggerItem}>
              <div
                className="bg-white rounded-xl border border-zinc-200 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => setSelectedId(selectedId === prop._id ? null : prop._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-zinc-900">{prop.title}</span>
                      <StatusBadge status={prop.ownershipStatus} />
                      <StatusBadge status={prop.dealType} />
                    </div>
                    <p className="text-xs text-zinc-500">
                      {prop.location}{prop.block ? ` · Block ${prop.block}` : ''}
                      {prop.size ? ` · ${prop.size} sq yd` : ''}
                      {prop.buildingAge ? ` · ${prop.buildingAge}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {prop.listedPrice && <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatRupees(prop.listedPrice)}</p>}
                    {prop.floorPrice  && <p className="text-xs text-zinc-400">floor {formatRupees(prop.floorPrice)}</p>}
                  </div>
                </div>

                {/* Expand: seller info + matched buyers */}
                {selectedId === prop._id && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-3">
                    {prop.sellerId && (
                      <div className="flex items-center gap-2">
                        <Avatar name={prop.sellerId.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-zinc-900">{prop.sellerId.name}</p>
                          <p className="text-xs text-zinc-500">Seller</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                          <a href={`tel:${prop.sellerId.phone}`} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400"><Phone className="w-3.5 h-3.5" /></a>
                          <a href={`https://wa.me/${prop.sellerId.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400"><MessageCircle className="w-3.5 h-3.5" /></a>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openAddDeal(prop._id)}>Create deal</Button>
                    </div>
                    <MatchedBuyers propertyId={prop._id} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function MatchedBuyers({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = usePropertyMatches(propertyId)
  const matches = data?.data?.matches || []
  const { openAddDeal } = useUIStore()

  if (isLoading) return <Skeleton className="h-10" />
  if (matches.length === 0) return <p className="text-xs text-zinc-400">No matching buyers in your leads</p>

  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
        {matches.length} matching buyer{matches.length > 1 ? 's' : ''}
      </p>
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
                onClick={() => openAddDeal(propertyId, lead._id)}
                className="text-xs px-2 py-1 rounded bg-zinc-900 text-white hover:opacity-90"
              >
                Deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
