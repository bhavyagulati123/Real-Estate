'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { KpiCard, Skeleton } from '@/components/ui'
import { formatRupees, formatDate } from '@/lib/utils'

export default function WealthPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.wealth(),
    queryFn:  () => api.get<any>('/api/wealth?limit=50'),
  })

  const entries = data?.data?.entries || []
  const summary = data?.data?.summary || { totalIncome: 0, totalExpense: 0, net: 0 }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-5">Wealth ledger</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Total income"  value={formatRupees(summary.totalIncome)}  />
        <KpiCard label="Total expense" value={formatRupees(summary.totalExpense)} />
        <KpiCard label="Net"           value={formatRupees(summary.net)}          sub={summary.net >= 0 ? 'profit' : 'loss'} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[52px]" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">No entries yet. Entries are created automatically when commissions are verified.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-widest">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-widest">Description</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-400 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((e: any) => (
                  <tr key={e._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-900">{e.description || e.category}</p>
                      <p className="text-xs text-zinc-400">{e.category}</p>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums text-sm ${e.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                      {e.type === 'income' ? '+' : '−'}{formatRupees(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
