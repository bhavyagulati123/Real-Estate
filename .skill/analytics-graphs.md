# Analytics & Graphs
> Tidal Vape OMS — AI Code Generation Directive
> Stack: Next.js (App Router) · TypeScript · Tailwind CSS (only) · Shadcn UI
> Read this file in full before generating any chart or data visualization.
> Cross-reference: design-system.md (color tokens) · oms-components.md (card wrapper)

---

## 1. Core Mandate

All charts in Tidal Vape OMS are strictly monochromatic. Every visualization must be readable without color — use shade, weight, opacity, and fill density instead. Charts must feel like they belong in a premium financial dashboard, not a colorful SaaS tool.

**RULES:**
- Use Recharts exclusively, accessed via Shadcn's chart component system
- All charts are wrapped in the standard card pattern from `oms-components.md`
- Every chart uses `ChartContainer` from Shadcn — never raw `ResponsiveContainer`
- Chart heights are fixed (not percentage-based); chart widths are always 100%
- No colored legends — use zinc-only fills; label everything via tooltips or inline labels
- Tooltips are always the custom `OmsChartTooltip` component — never Recharts default

**DON'T use:**
```
DON'T: Chart.js
DON'T: Victory
DON'T: D3 directly
DON'T: Any charting library that forces a color scheme
DON'T: Recharts default tooltip
DON'T: Colored fills (blue, green, red bars/areas)
```

---

## 2. Dependencies

```bash
npx shadcn@latest add chart
```

This installs `recharts` and adds `components/ui/chart.tsx` with `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, and `ChartLegend`.

**Import pattern:**
```tsx
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis,
  ResponsiveContainer,
} from 'recharts'
```

---

## 3. Monochrome Color Strategy

**Fill palette — 5 stops from dark to light:**
| Stop | Approximate Zinc | HSL Value | Usage |
|------|-----------------|-----------|-------|
| 1 | zinc-900 | `hsl(240, 10%, 3.9%)` | Primary series, main bars |
| 2 | zinc-700 | `hsl(240, 5%, 26%)` | Secondary series |
| 3 | zinc-500 | `hsl(240, 4%, 46%)` | Tertiary series |
| 4 | zinc-400 | `hsl(240, 4%, 65%)` | Quaternary / muted series |
| 5 | zinc-200 | `hsl(240, 5%, 85%)` | Background fills, disabled |

**Area chart gradient (zinc-900 fade):**
```tsx
<defs>
  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%"  stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0.12} />
    <stop offset="95%" stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0}    />
  </linearGradient>
</defs>
```

**Grid lines:** `stroke="hsl(240, 5%, 94%)"` — ultra-light zinc-100

**Axis labels:** `fill="hsl(240, 4%, 65%)"` — zinc-400, `fontSize={12}`

---

## 4. ChartConfig Pattern

```tsx
import { type ChartConfig } from '@/components/ui/chart'

// Revenue + Orders dual-series example
export const revenueChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(240, 10%, 3.9%)',   // zinc-900
  },
  orders: {
    label: 'Orders',
    color: 'hsl(240, 4%, 46%)',     // zinc-500
  },
} satisfies ChartConfig

// Single series (most common)
export const ordersChartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--foreground))', // resolves to zinc-900 via CSS variable
  },
} satisfies ChartConfig
```

---

## 5. Area Chart — Revenue Over Time

Use for the primary revenue trend on the dashboard. Full-width, inside a card.

```tsx
// components/charts/revenue-chart.tsx
'use client'
import { AreaChart, Area, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { OmsChartTooltip } from '@/components/charts/oms-chart-tooltip'
import { revenueChartConfig } from '@/lib/chart-configs'

interface RevenueDataPoint {
  date: string
  revenue: number
}

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0.12} />
            <stop offset="95%" stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="hsl(240, 5%, 94%)" />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(240, 4%, 65%)', fontSize: 12, fontFamily: 'inherit' }}
          tickMargin={8}
        />

        <ChartTooltip content={<OmsChartTooltip />} />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(240, 10%, 3.9%)"
          strokeWidth={1.5}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(240, 10%, 3.9%)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

**Usage in a card:**
```tsx
<div className="rounded-2xl border border-zinc-200 bg-white col-span-full overflow-hidden">
  <div className="p-6 pb-0">
    <h3 className="text-base font-semibold text-zinc-900">Revenue</h3>
    <p className="text-xs text-zinc-400 mt-0.5">Last 30 days</p>
  </div>
  <div className="px-2 pb-4 pt-2">
    <RevenueChart data={revenueData} />
  </div>
</div>
```

---

## 6. Bar Chart — Orders by Period or Status

```tsx
// components/charts/orders-bar-chart.tsx
'use client'
import { BarChart, Bar, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { OmsChartTooltip } from '@/components/charts/oms-chart-tooltip'
import { ordersChartConfig } from '@/lib/chart-configs'

interface OrderBarDataPoint {
  period: string
  orders: number
}

export function OrdersBarChart({ data }: { data: OrderBarDataPoint[] }) {
  return (
    <ChartContainer config={ordersChartConfig} className="h-[220px] w-full">
      <BarChart data={data} barSize={28} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(240, 5%, 94%)" />

        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(240, 4%, 65%)', fontSize: 12, fontFamily: 'inherit' }}
          tickMargin={8}
        />

        <ChartTooltip content={<OmsChartTooltip />} />

        <Bar
          dataKey="orders"
          fill="hsl(240, 10%, 3.9%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
```

**Multi-series bar (two series):**
```tsx
// Use only zinc-900 and zinc-300 — never introduce a third hue
<Bar dataKey="fulfilled" fill="hsl(240, 10%, 3.9%)" radius={[4, 4, 0, 0]} />
<Bar dataKey="cancelled" fill="hsl(240, 5%, 78%)"  radius={[4, 4, 0, 0]} />
```

**DON'T:**
```
DON'T: Flat-bottom bars without radius — always use radius={[4,4,0,0]}
DON'T: barSize larger than 32 — max 32 for readability
DON'T: More than 2 series on a bar chart — use a table instead
```

---

## 7. Donut Chart — Order Status Breakdown

```tsx
// components/charts/status-donut-chart.tsx
'use client'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { OmsChartTooltip } from '@/components/charts/oms-chart-tooltip'

interface StatusDataPoint {
  name: string
  value: number
}

const DONUT_FILLS = [
  'hsl(240, 10%, 3.9%)',  // zinc-900 — fulfilled (largest expected)
  'hsl(240, 4%, 55%)',    // zinc-500 — processing
  'hsl(240, 5%, 82%)',    // zinc-300 — pending
]

const donutConfig = {
  fulfilled:  { label: 'Fulfilled',  color: DONUT_FILLS[0] },
  processing: { label: 'Processing', color: DONUT_FILLS[1] },
  pending:    { label: 'Pending',    color: DONUT_FILLS[2] },
}

export function StatusDonutChart({
  data,
  total,
}: {
  data: StatusDataPoint[]
  total: number
}) {
  return (
    <div className="relative">
      <ChartContainer config={donutConfig} className="h-[200px] w-full">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            strokeWidth={0}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={DONUT_FILLS[index % DONUT_FILLS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<OmsChartTooltip hideLabel />} />
        </PieChart>
      </ChartContainer>

      {/* Center label — absolutely positioned */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-semibold tabular-nums text-zinc-900">
          {total.toLocaleString()}
        </span>
        <span className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Orders</span>
      </div>
    </div>
  )
}
```

---

## 8. Custom Tooltip

**RULE:** Always use this component. Never use Recharts' default tooltip or `ChartTooltipContent` without customization.

```tsx
// components/charts/oms-chart-tooltip.tsx
'use client'
import { TooltipProps } from 'recharts'
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

interface OmsChartTooltipProps extends TooltipProps<ValueType, NameType> {
  hideLabel?: boolean
  formatValue?: (value: ValueType) => string
}

export function OmsChartTooltip({
  active,
  payload,
  label,
  hideLabel = false,
  formatValue,
}: OmsChartTooltipProps) {
  if (!active || !payload?.length) return null

  const defaultFormat = (v: ValueType): string => {
    if (typeof v === 'number') return v.toLocaleString()
    return String(v)
  }

  const fmt = formatValue ?? defaultFormat

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg min-w-[140px]">
      {!hideLabel && label && (
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">{entry.name}</span>
          <span className="text-sm font-semibold tabular-nums text-zinc-900">
            {fmt(entry.value as ValueType)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Currency tooltip example:**
```tsx
<ChartTooltip
  content={
    <OmsChartTooltip
      formatValue={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : String(v)}
    />
  }
/>
```

---

## 9. KPI Sparkline

Minimal area chart for use inside KPI cards — no axes, no tooltip, no grid, just the trend line.

```tsx
// components/charts/sparkline.tsx
'use client'
import { AreaChart, Area } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

interface SparklineProps {
  data: { v: number }[]
  className?: string
}

const sparkConfig = {
  v: { label: 'Value', color: 'hsl(240, 10%, 3.9%)' },
}

export function Sparkline({ data, className }: SparklineProps) {
  return (
    <ChartContainer config={sparkConfig} className={className ?? 'h-[48px] w-full'}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0.08} />
            <stop offset="95%" stopColor="hsl(240, 10%, 3.9%)" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke="hsl(240, 10%, 3.9%)"
          strokeWidth={1.5}
          fill="url(#sparkGradient)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

**DON'T:**
```
DON'T: Show axes on sparklines — they are context-free trend indicators only
DON'T: Show tooltips on sparklines — use the KPI value above for detail
DON'T: Use strokeWidth > 1.5 on sparklines
DON'T: Use isAnimationActive on sparklines (they're inside already-animated cards)
```

---

## 10. Responsive Rules

| Chart Type | Height | Width | Notes |
|------------|--------|-------|-------|
| Primary revenue area | `h-[280px]` | `w-full` | Full card width |
| Secondary area/bar | `h-[220px]` | `w-full` | Sidebar / half-width card |
| Donut | `h-[200px]` | `w-full` | Square-ish card |
| KPI sparkline | `h-[48px]` | `w-full` | Inside KPI card |

**Mobile behavior:**
```tsx
// Hide secondary charts on small screens
<div className="hidden md:block">
  <OrdersBarChart data={barData} />
</div>

// Primary revenue chart: reduce XAxis ticks on mobile
<XAxis
  dataKey="date"
  interval={isMobile ? 6 : 2}  // show fewer labels
  // ...
/>
```

**RULE:** Never use percentage heights on charts — always explicit pixel heights via Tailwind arbitrary values (`h-[280px]`).

---

## 11. Chart Card Wrapper

Every chart lives inside a card from `oms-components.md`. Use this consistent wrapper:

```tsx
interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  fullWidth?: boolean
}

export function ChartCard({ title, subtitle, children, action, fullWidth }: ChartCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-zinc-200 bg-white shadow-sm',
      fullWidth ? 'col-span-full overflow-hidden' : ''
    )}>
      <div className="flex items-start justify-between p-6 pb-0">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-2 pb-4 pt-4">
        {children}
      </div>
    </div>
  )
}
```
