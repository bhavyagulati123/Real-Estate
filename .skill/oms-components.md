# OMS Components
> Tidal Vape OMS — AI Code Generation Directive
> Stack: Next.js (App Router) · TypeScript · Tailwind CSS (only) · Shadcn UI
> Read this file in full before generating any OMS component.
> Cross-reference: design-system.md (colors, spacing, radius) · animations.md (hover, entrance, skeletons)

---

## 1. Core Mandate

This file defines the complete component vocabulary for the Tidal Vape OMS. Every UI element — tables, forms, cards, badges, KPIs, navigation — is specified here with exact Tailwind classes and TypeScript patterns.

**RULES:**
- All components are built on Shadcn UI primitives with B&W overrides from `design-system.md`
- All components are TypeScript with strict prop typing — no `any`
- Components are server-component-safe by default; add `'use client'` only when interactivity is required
- Import Shadcn components from `@/components/ui/*`
- Use `cn()` from `@/lib/utils` for conditional class merging — never string concatenation

---

## 2. Data Tables

**Stack:** `@tanstack/react-table` + Shadcn `Table` components. Always `'use client'`.

**Required packages:**
```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

### Container
```tsx
<div className="rounded-2xl border border-zinc-200 overflow-hidden">
  <Table>...</Table>
</div>
```

### Header
```tsx
<TableHeader>
  <TableRow className="border-b border-zinc-200 hover:bg-transparent">
    <TableHead className="h-11 bg-zinc-50 text-xs font-medium text-zinc-400 uppercase tracking-widest sticky top-0 z-10">
      Customer
    </TableHead>
  </TableRow>
</TableHeader>
```

### Body Row
```tsx
<TableRow className="border-b border-zinc-100 transition-colors duration-150 hover:bg-zinc-50 h-[52px] cursor-pointer">
  <TableCell className="text-sm text-zinc-900 tabular-nums">
    {/* primary data */}
  </TableCell>
  <TableCell className="text-sm text-zinc-400">
    {/* secondary data */}
  </TableCell>
</TableRow>
```

### Column Definition Pattern
```tsx
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const columns: ColumnDef<Order>[] = [
  {
    id: 'orderId',
    accessorKey: 'orderId',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-xs font-medium text-zinc-400 uppercase tracking-widest hover:text-zinc-900 hover:bg-transparent"
        onClick={() => column.toggleSorting()}
      >
        Order ID
        <ArrowUpDown className="ml-1.5 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-zinc-500">#{row.original.orderId}</span>
    ),
  },
  {
    id: 'customer',
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => (
      <span className="text-sm font-medium text-zinc-900">{row.original.customerName}</span>
    ),
  },
]
```

### Pagination
```tsx
<div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
  <p className="text-xs text-zinc-400">
    Showing {firstRow}–{lastRow} of {total} orders
  </p>
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>
```

**DON'T:**
```
DON'T: Zebra striping (alternating row backgrounds)
DON'T: Full grid borders — divide-y on tbody only
DON'T: Fixed column widths on all columns — use auto with min-w constraints
DON'T: Bold text in table cells — use font-medium at most
```

---

## 3. Forms

**Stack:** `react-hook-form` + `zod` for validation. Shadcn `Input`, `Label`, `Select`, `Checkbox`, `Switch`, `Textarea`.

**Required packages:**
```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add input label select checkbox switch textarea
```

### Label Pattern
```tsx
<Label className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block">
  Customer Name
</Label>
```

### Input
```tsx
<Input
  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900
             placeholder:text-zinc-400
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1
             transition-shadow duration-150"
  placeholder="Jane Smith"
/>
```

### Error State
```tsx
// Border shifts to zinc-900, error message below — no red
<Input className="border-zinc-900 ring-1 ring-zinc-900 ..." />
<p className="mt-1 text-xs text-zinc-500 italic">This field is required</p>
```

### Fieldset Group
```tsx
<fieldset className="space-y-4 rounded-2xl border border-zinc-200 p-6">
  <legend className="text-xs font-medium text-zinc-400 uppercase tracking-widest px-1 -ml-1">
    Customer Details
  </legend>
  {/* inputs */}
</fieldset>
```

### Full Form Pattern with react-hook-form
```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  customerName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
})
type FormValues = z.infer<typeof schema>

export function OrderForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))} className="space-y-5">
      <div>
        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block">
          Customer Name
        </Label>
        <Input
          {...register('customerName')}
          className={cn(
            'h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 transition-shadow duration-150',
            errors.customerName ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-300'
          )}
        />
        {errors.customerName && (
          <p className="mt-1 text-xs text-zinc-500 italic">{errors.customerName.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          className="h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity duration-150 px-6"
        >
          Save Order
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg px-4 transition-colors duration-150"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

**DON'T:**
```
DON'T: Red for error states — use zinc-900 ring + italic text
DON'T: Floating labels — use clean inline uppercase labels
DON'T: Default Shadcn focus ring (blue) — always override to ring-zinc-900
DON'T: Placeholder text as a label substitute
```

---

## 4. Cards & Bento Grid

### Grid Container
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* cards */}
</div>
```

### Standard Card
```tsx
<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
  {/* content */}
</div>
```

### Wide Card (2 columns)
```tsx
<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2">
  {/* content */}
</div>
```

### Full-Width Card (table, chart)
```tsx
<div className="rounded-2xl border border-zinc-200 bg-white col-span-full overflow-hidden">
  {/* no padding — table/chart manages its own padding */}
</div>
```

### Dark Featured Card
```tsx
<div className="rounded-2xl bg-zinc-900 p-6 text-white shadow-sm">
  <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Total Revenue</p>
  <p className="mt-2 text-4xl font-semibold tabular-nums">$128,400</p>
</div>
```

### Card Header Pattern
```tsx
<div className="flex items-start justify-between mb-6">
  <div>
    <h3 className="text-base font-semibold text-zinc-900">Revenue</h3>
    <p className="text-xs text-zinc-400 mt-0.5">Last 30 days</p>
  </div>
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg -mr-1 -mt-1"
  >
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</div>
```

---

## 5. Status Badges

**RULE:** All status is communicated through zinc shade + opacity — never through color.
**RULE:** Always pill-shaped, always uppercase, always `text-xs tracking-widest`.

### Base Pattern
```tsx
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-widest">
  {label}
</span>
```

### Status Config (TypeScript)
```tsx
type OrderStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled' | 'refunded' | 'on_hold'

const statusConfig: Record<OrderStatus, { className: string; label: string }> = {
  pending:    { className: 'bg-zinc-100 text-zinc-500',                           label: 'Pending'    },
  processing: { className: 'bg-zinc-200 text-zinc-700',                           label: 'Processing' },
  fulfilled:  { className: 'bg-zinc-900 text-white',                              label: 'Fulfilled'  },
  cancelled:  { className: 'bg-zinc-100 text-zinc-400 line-through',              label: 'Cancelled'  },
  refunded:   { className: 'border border-zinc-300 text-zinc-500 bg-white',       label: 'Refunded'   },
  on_hold:    { className: 'bg-zinc-800 text-zinc-200',                           label: 'On Hold'    },
}

// Component
export function StatusBadge({ status }: { status: OrderStatus }) {
  const { className, label } = statusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-widest',
      className
    )}>
      {label}
    </span>
  )
}
```

### Badge with Dot (for live/active states)
```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 uppercase tracking-widest">
  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" />
  Pending
</span>
```

**DON'T:**
```
DON'T: Green for fulfilled, red for cancelled — use zinc shades only
DON'T: Rectangular badges — always rounded-full
DON'T: badge text larger than text-xs
```

---

## 6. KPI Metric Cards

**RULE:** Every KPI card follows the exact same structure: label → value → trend → optional sparkline.

```tsx
// components/kpi-card.tsx
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/animated-number'

interface KpiCardProps {
  label: string
  value: number
  trend: number        // e.g. 12.4 means +12.4%
  period?: string      // e.g. "vs last month"
  prefix?: string      // e.g. "$"
  sparkData?: { v: number }[]
}

export function KpiCard({ label, value, trend, period = 'vs last month', prefix = '', sparkData }: KpiCardProps) {
  const isPositive = trend >= 0
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">

      {/* Label */}
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
        {label}
      </p>

      {/* Primary Value */}
      <p className="mt-2 text-4xl font-semibold tabular-nums text-zinc-900">
        {prefix}<AnimatedNumber value={value} />
      </p>

      {/* Trend Row */}
      <div className="mt-3 flex items-center gap-1.5">
        {isPositive
          ? <TrendingUp className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          : <TrendingDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        }
        <span className={cn('text-sm font-medium', isPositive ? 'text-zinc-900' : 'text-zinc-400')}>
          {isPositive ? '+' : ''}{trend}%
        </span>
        <span className="text-xs text-zinc-400">{period}</span>
      </div>

      {/* Optional Sparkline */}
      {sparkData && (
        <div className="mt-4 h-[48px]">
          {/* See analytics-graphs.md for sparkline implementation */}
        </div>
      )}

    </div>
  )
}
```

**KPI Grid:**
```tsx
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
  <KpiCard label="Total Orders" value={2840} trend={12.4} />
  <KpiCard label="Revenue"      value={128400} trend={8.2}  prefix="$" />
  <KpiCard label="Avg Order"    value={452}    trend={-3.1} prefix="$" />
  <KpiCard label="Fulfilment"   value={94.2}   trend={1.8}  prefix="" />
</div>
```

**DON'T:**
```
DON'T: Green for positive trends, red for negative — zinc-900 (positive) / zinc-400 (negative)
DON'T: Icons larger than h-3.5 w-3.5 in trend rows
DON'T: Percentage text larger than text-sm in trend rows
DON'T: More than 4 KPI cards in one row on desktop
```

---

## 7. Sidebar Navigation

```tsx
// components/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  BarChart2, Settings, User
} from 'lucide-react'

const navSections = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/orders',    icon: ShoppingBag,     label: 'Orders'    },
      { href: '/customers', icon: Users,            label: 'Customers' },
      { href: '/inventory', icon: Package,          label: 'Inventory' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white px-3 py-6 shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="h-7 w-7 rounded-lg bg-zinc-900 shrink-0" />
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">Tidal Vape</span>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                        isActive
                          ? 'bg-zinc-900 text-white font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-zinc-400')} />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom — Settings + User */}
      <div className="border-t border-zinc-100 pt-4 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors duration-150"
        >
          <Settings className="h-4 w-4 text-zinc-400" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 cursor-pointer transition-colors duration-150 group">
          <div className="h-7 w-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 truncate">Admin User</p>
            <p className="text-[10px] text-zinc-400 truncate">admin@tidalvape.com</p>
          </div>
        </div>
      </div>

    </nav>
  )
}
```

**DON'T:**
```
DON'T: Colored accent bar for active state — use full bg-zinc-900 pill
DON'T: Nav icons larger than h-4 w-4
DON'T: Section label text larger than text-[10px] uppercase
DON'T: Add borders between nav items — spacing alone creates separation
```

---

## 8. Command Palette

Shadcn `CommandDialog` triggered by `Cmd+K`.

**Required:**
```bash
npx shadcn@latest add command dialog
```

**Setup in root layout (client component):**
```tsx
'use client'
import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

export function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search orders, customers, products..."
        className="text-sm text-zinc-900 placeholder:text-zinc-400 border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty className="text-sm text-zinc-400 text-center py-6">
          No results found.
        </CommandEmpty>
        <CommandGroup
          heading="Orders"
          className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
        >
          <CommandItem className="rounded-lg text-sm text-zinc-700 aria-selected:bg-zinc-900 aria-selected:text-white">
            #1042 — Jane Smith
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Trigger hint in sidebar or header:**
```tsx
<button className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-100 transition-colors duration-150">
  <Search className="h-3 w-3" />
  Search
  <kbd className="ml-auto font-mono text-[10px] text-zinc-300">⌘K</kbd>
</button>
```

---

## 9. Page Layout Shell

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
```

**Page wrapper:**
```tsx
// Inside any page component
<div className="px-8 py-10 max-w-screen-xl">

  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Orders</h1>
    <p className="mt-1 text-sm text-zinc-500">Manage and track all customer orders</p>
  </div>

  {/* Content */}
  {children}

</div>
```
