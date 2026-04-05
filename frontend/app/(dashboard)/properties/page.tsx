'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useProperties } from '@/hooks/useData'
import { Skeleton, StatusBadge, Button, EmptyState } from '@/components/ui'
import { useUIStore } from '@/store/useUIStore'
import { formatRupees } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'

export default function PropertiesPage() {
  const { propertiesFilter, setPropertiesFilter, openAddProperty } = useUIStore()
  const [search, setSearch]           = useState('')
  const router = useRouter()

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
                onClick={() => router.push(`/properties/${prop._id}`)}
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
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
