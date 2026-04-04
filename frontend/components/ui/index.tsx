// components/ui/index.tsx
// All primitive UI components in one file

import { cn } from '@/lib/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayVariants, sheetVariants } from '@/lib/motion'
import { X } from 'lucide-react'

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={cn(sizes[size], 'rounded-full bg-blue-50 flex items-center justify-center font-medium text-blue-700 flex-shrink-0 select-none')}>
      {initials}
    </div>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  new:              'bg-zinc-100 text-zinc-600',
  contacted:        'bg-blue-50 text-blue-700',
  interested:       'bg-teal-50 text-teal-700',
  visit:            'bg-purple-50 text-purple-700',
  negotiation:      'bg-amber-50 text-amber-700',
  bayana:           'bg-orange-50 text-orange-700',
  papers:           'bg-yellow-50 text-yellow-800',
  closed:           'bg-green-50 text-green-700',
  lost:             'bg-zinc-100 text-zinc-400',
  available:        'bg-green-50 text-green-700',
  underNegotiation: 'bg-amber-50 text-amber-700',
  sold:             'bg-zinc-100 text-zinc-500',
  ownerOwned:       'bg-blue-50 text-blue-700',
  low:              'bg-green-50 text-green-700',
  medium:           'bg-amber-50 text-amber-700',
  high:             'bg-red-50 text-red-700',
  brokerage:        'bg-zinc-100 text-zinc-600',
  inflated:         'bg-purple-50 text-purple-700',
  coInvestment:     'bg-blue-50 text-blue-700',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', statusStyles[status] ?? 'bg-zinc-100 text-zinc-500', className)}>
      {status}
    </span>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer', className)} />
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
export function Input({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        'w-full h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none',
        'focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 transition-shadow duration-150',
        error ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-300',
        className
      )}
      {...props}
    />
  )
}

// ─── TEXTAREA ─────────────────────────────────────────────────────────────────
export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none resize-none',
        'focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 transition-shadow duration-150',
        className
      )}
      {...props}
    />
  )
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none',
        'focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 transition-shadow duration-150',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

// ─── LABEL ────────────────────────────────────────────────────────────────────
export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1.5 block', className)} {...props}>
      {children}
    </label>
  )
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary:   'bg-zinc-900 text-white hover:opacity-90',
    secondary: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    ghost:     'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
    danger:    'bg-red-50 text-red-700 hover:bg-red-100',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-5 text-sm' }
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : null}
      {children}
    </button>
  )
}

// ─── SHEET (slide-in panel) ───────────────────────────────────────────────────
interface SheetProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  width?:   string
}

export function Sheet({ open, onClose, title, children, width = 'max-w-md' }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            variants={sheetVariants}
            initial="hidden" animate="visible" exit="exit"
            className={cn('fixed right-0 top-0 h-full w-full bg-white z-50 overflow-y-auto shadow-2xl', width)}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-zinc-200 p-4',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="mb-4 text-zinc-300">{icon}</div>}
      <p className="text-sm font-medium text-zinc-900 mb-1">{title}</p>
      {description && <p className="text-sm text-zinc-400 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── ERROR MESSAGE ────────────────────────────────────────────────────────────
export function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-zinc-500 italic">{message}</p>
}
