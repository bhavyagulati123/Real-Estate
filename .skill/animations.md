# Animations & Interactions
> Tidal Vape OMS — AI Code Generation Directive
> Stack: Next.js (App Router) · TypeScript · Tailwind CSS (only) · Shadcn UI
> Read this file in full before generating any animation or interaction code.

---

## 1. Core Mandate

All animations must feel "earned" — they communicate state change or guide attention. They are never decorative.

**RULES:**
- Use `framer-motion` for all component-level animations (entrances, exits, modals, lists)
- Use Tailwind transition utilities (`transition-*`, `duration-*`, `ease-*`) only for hover/focus state changes on simple elements
- No custom `@keyframes` in CSS files — the one exception is the shimmer skeleton (defined in `tailwind.config.ts`, not in CSS)
- Never animate color properties — animate opacity, scale, translate, and shadow only
- Exits must be faster than entrances (exits: 150ms, entrances: 250–350ms)

**DON'T use:**
```
DON'T: react-spring
DON'T: GSAP
DON'T: CSS animation classes defined in globals.css (except Shadcn's internal styles)
DON'T: hover:animate-* Tailwind utilities — they are too abrupt
```

---

## 2. Dependencies

```bash
npm install framer-motion
```

Import pattern:
```tsx
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
```

---

## 3. Timing Reference

| Name | Duration | Tailwind Class | When to Use |
|------|----------|---------------|-------------|
| INSTANT | 0ms | — | State toggles with no visible transition |
| FAST | 150ms | `duration-150` | Hover, focus ring, color shifts |
| STANDARD | 200ms | `duration-200` | Button press, icon swap |
| ENTER | 250–300ms | Framer Motion | Elements entering viewport |
| EXIT | 150ms | Framer Motion | Elements leaving (always faster) |
| PAGE | 350–400ms | Framer Motion | Page-level transitions |
| STAGGER | 50ms | Framer Motion `staggerChildren` | List items appearing sequentially |

**Easing values:**
```ts
const ease = {
  standard: [0.4, 0, 0.2, 1],  // cubic-bezier — general purpose
  enter:    [0,   0, 0.2, 1],   // ease-out — smooth arrivals
  exit:     [0.4, 0, 1,   1],   // ease-in  — quick departures
  spring:   { type: 'spring', stiffness: 300, damping: 30 },
}
```

---

## 4. Hover Micro-interactions (Tailwind Only)

Apply directly to element `className`. No Framer Motion needed for these.

**Card hover:**
```tsx
className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
```

**Primary button hover:**
```tsx
className="transition-opacity duration-150 hover:opacity-90 active:opacity-75 active:scale-[0.99]"
```

**Table row hover:**
```tsx
className="transition-colors duration-150 hover:bg-zinc-50 cursor-pointer"
```

**Icon button hover:**
```tsx
className="transition-colors duration-150 hover:bg-zinc-100 rounded-lg p-2"
```

**Navigation item hover (inactive):**
```tsx
className="transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl"
```

**Text link hover:**
```tsx
className="transition-colors duration-150 text-zinc-400 hover:text-zinc-900"
```

**DON'T:**
```
DON'T: hover:scale-105 or hover:scale-110 — too aggressive
DON'T: hover:bg-* on cards — use shadow + translate instead
DON'T: hover:brightness-* or hover:contrast-*
DON'T: transition-all on text-heavy elements (causes layout reflow)
```

---

## 5. Framer Motion — Entrance Variants

Define these in a shared `lib/motion.ts` file and import where needed.

```ts
// lib/motion.ts

import { Variants } from 'framer-motion'

// Single element fade + slide up — for cards, panels, sections
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
}

// Parent container for staggered children
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
}

// Child item inside a staggered list
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0, 0, 0.2, 1] },
  },
}

// Page-level transition — use in layout.tsx
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
}
```

**Usage — single card:**
```tsx
<motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
  <OrderCard order={order} />
</motion.div>
```

**Usage — staggered list (dashboard grid, order list):**
```tsx
<motion.ul
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
>
  {kpis.map((kpi) => (
    <motion.li key={kpi.id} variants={staggerItem}>
      <KpiCard {...kpi} />
    </motion.li>
  ))}
</motion.ul>
```

---

## 6. Page Transitions (Next.js App Router)

Wrap page content in a motion component. Use `AnimatePresence` at the layout level.

```tsx
// app/(dashboard)/layout.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { pageVariants } from '@/lib/motion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
```

---

## 7. Modal & Sheet Variants

```ts
// lib/motion.ts (add to existing file)

// Overlay backdrop
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
}

// Modal dialog panel (scale + fade)
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
}

// Side sheet / drawer (slides from right)
export const sheetVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 350, damping: 35 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}
```

**Usage with AnimatePresence:**
```tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        variants={overlayVariants}
        initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className="fixed inset-x-4 top-[10%] z-50 rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## 8. Loading Skeletons

**RULE:** All data-loading states use skeleton placeholders. Never spinners alone.
**RULE:** Skeleton shape must match the real content exactly.
**RULE:** Do not show skeletons for operations completing in under 300ms — add a delay.

**Shimmer — define in `tailwind.config.ts` (NOT in CSS files):**
```ts
// tailwind.config.ts
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%':   { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
    animation: {
      shimmer: 'shimmer 1.5s infinite linear',
    },
  },
}
```

**Skeleton element pattern:**
```tsx
// Apply these classes to div elements matching the shape of real content

// Text line
<div className="h-4 w-32 rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />

// Wider text line
<div className="h-4 w-48 rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />

// Card block
<div className="h-[120px] w-full rounded-2xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />

// KPI number
<div className="h-10 w-24 rounded-xl bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />

// Avatar / circle
<div className="h-9 w-9 rounded-full bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />

// Table row
<div className="h-[52px] w-full rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer" />
```

**Skeleton wrapper utility (create once in `components/ui/skeleton.tsx`):**
```tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-[length:200%_100%] animate-shimmer',
        className
      )}
    />
  )
}
```

**DON'T:**
```
DON'T: Use gray-300 or slate-200 for skeletons — zinc-100/zinc-200 only
DON'T: Use animate-pulse from Tailwind — use animate-shimmer (directional gradient)
DON'T: Show skeleton indefinitely — always pair with a loading state boolean
```

---

## 9. Animated Number Counter (KPI Cards)

Use Framer Motion's spring physics for satisfying count-up animations on KPI numbers.

```tsx
// components/ui/animated-number.tsx
'use client'

import { useEffect } from 'react'
import { useSpring, useTransform, motion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  formatter?: (v: number) => string
}

export function AnimatedNumber({
  value,
  formatter = (v) => Math.round(v).toLocaleString(),
}: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, formatter)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className="tabular-nums">{display}</motion.span>
}
```

**Usage:**
```tsx
<p className="text-4xl font-semibold text-zinc-900">
  $<AnimatedNumber value={128400} formatter={(v) => Math.round(v).toLocaleString()} />
</p>
```

---

## 10. Accordion / Expand-Collapse

For filter panels, detail sections, or collapsible rows.

```tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

// Wrap the collapsible content in this pattern
<AnimatePresence initial={false}>
  {isOpen && (
    <motion.div
      key="content"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
      exit={{   height: 0, opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
      className="overflow-hidden"
    >
      <div className="pt-4">
        {/* content */}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 11. Presence Rules Summary

| Always wrap with AnimatePresence when... |
|------------------------------------------|
| A modal or sheet opens/closes |
| A dropdown or popover appears/disappears |
| A page route changes |
| A toast notification enters/exits |
| A list item is added or removed |

Use `mode="wait"` on `AnimatePresence` when only one child should be visible at a time (pages, tabs).
Use default mode for lists where multiple items can enter/exit simultaneously.
