'use client'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id:       string
  message:  string
  variant:  ToastVariant
  duration: number
}

interface ToastApi {
  show:    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void
  success: (message: string, opts?: { duration?: number }) => void
  error:   (message: string, opts?: { duration?: number }) => void
  info:    (message: string, opts?: { duration?: number }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function Icon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <CheckCircle2 className="w-4 h-4 text-green-600" />
  if (variant === 'error') return <AlertCircle className="w-4 h-4 text-red-600" />
  return <Info className="w-4 h-4 text-blue-600" />
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const handle = timers.current[id]
    if (handle) window.clearTimeout(handle)
    delete timers.current[id]
  }, [])

  const show = useCallback((message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    const duration = opts?.duration ?? 2600
    const variant = opts?.variant ?? 'info'
    const item: ToastItem = { id, message, variant, duration }

    setToasts((t) => [item, ...t].slice(0, 3))
    timers.current[id] = window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (m, o) => show(m, { variant: 'success', duration: o?.duration }),
    error:   (m, o) => show(m, { variant: 'error', duration: o?.duration ?? 3200 }),
    info:    (m, o) => show(m, { variant: 'info', duration: o?.duration }),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-md pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'pointer-events-auto mb-2 flex items-start gap-2 rounded-xl border bg-white px-3 py-2 shadow-lg',
                t.variant === 'success' && 'border-green-200',
                t.variant === 'error' && 'border-red-200',
                t.variant === 'info' && 'border-blue-200'
              )}
            >
              <div className="mt-0.5"><Icon variant={t.variant} /></div>
              <p className="text-sm text-zinc-800 flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

