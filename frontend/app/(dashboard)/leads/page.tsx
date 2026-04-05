'use client'
import { motion } from 'framer-motion'
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { LeadListItem } from '@/components/LeadListItem'
import { Skeleton, Button, EmptyState, Select } from '@/components/ui'
import { useUIStore } from '@/store/useUIStore'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { BLOCKS, LEAD_STATUSES } from '@/lib/utils'
import { useState } from 'react'

export default function LeadsPage() {
  const { leadsFilter, setLeadsFilter, resetLeadsFilter, openAddLead } = useUIStore()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filters = { ...leadsFilter, search: search || undefined, limit: 50 }
  const { data, isLoading } = useLeads(filters)
  const leads = data?.data || []
  const total = data?.pagination?.total || 0

  const hasFilter = !!(leadsFilter.leadType || leadsFilter.status || leadsFilter.block || leadsFilter.overdueOnly)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Leads</h1>
          {total > 0 && <p className="text-sm text-zinc-500 mt-0.5">{total} total</p>}
        </div>
        <Button size="sm" onClick={openAddLead}><Plus className="w-4 h-4" /> Add lead</Button>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
          />
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`h-10 px-3 rounded-lg border text-sm transition-colors ${hasFilter ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        {hasFilter && (
          <button onClick={resetLeadsFilter} className="h-10 px-3 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-sm">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 sm:grid-cols-4">
          <Select value={leadsFilter.leadType || ''} onChange={e => setLeadsFilter({ leadType: e.target.value as any || undefined })}>
            <option value="">All types</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
          </Select>
          <Select value={leadsFilter.status || ''} onChange={e => setLeadsFilter({ status: e.target.value || undefined })}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={leadsFilter.block || ''} onChange={e => setLeadsFilter({ block: e.target.value || undefined })}>
            <option value="">All blocks</option>
            {BLOCKS.map(b => <option key={b} value={b}>Block {b}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer px-1">
            <input
              type="checkbox"
              checked={!!leadsFilter.overdueOnly}
              onChange={e => setLeadsFilter({ overdueOnly: e.target.checked || undefined })}
            />
            Overdue only
          </label>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[80px]" />)}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={hasFilter || search ? 'Try adjusting your filters' : 'Add your first lead'}
          action={!hasFilter && !search ? <Button onClick={openAddLead}><Plus className="w-4 h-4" /> Add lead</Button> : undefined}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {leads.map(lead => (
            <motion.div key={lead._id} variants={staggerItem}>
              <LeadListItem lead={lead} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
