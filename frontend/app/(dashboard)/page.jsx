import { LeadCard } from '@/components/LeadCard'
import { SectionCard } from '@/components/SectionCard'
import { mockDashboard } from '@/lib/mock-data'

export default function DashboardPage() {
  const { overdue, dueToday, upcoming, activeDeals, stats } = mockDashboard

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Daily View</p>
        <h2 className="mt-2 text-lg font-medium text-gray-900">Today&apos;s priorities</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Active leads</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalActiveLeads}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs text-red-700">Overdue</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">{overdue.length}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs text-amber-700">Due today</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{dueToday.length}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-blue-700">Active deals</p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">{activeDeals.length}</p>
          </div>
        </div>
      </section>

      <SectionCard title={`Overdue (${overdue.length})`} subtitle="Oldest follow-ups first">
        <div className="space-y-3">
          {overdue.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Due Today (${dueToday.length})`} subtitle="Calls that need action today">
        <div className="space-y-3">
          {dueToday.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Upcoming (${upcoming.length})`} subtitle="Next two days">
        <div className="space-y-3">
          {upcoming.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
