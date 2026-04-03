import { LeadCard } from '@/components/LeadCard'
import { SectionCard } from '@/components/SectionCard'
import { mockLeads } from '@/lib/mock-data'

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Buyers and sellers with follow-up-first workflow.
        </p>
      </div>

      <SectionCard title="Lead Pipeline" subtitle="Mobile-first card list from the CRM foundation">
        <div className="space-y-3">
          {mockLeads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
