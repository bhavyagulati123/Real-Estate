# Design System
> Tidal Vape OMS — AI Code Generation Directive
> Stack: Next.js (App Router) · TypeScript · Tailwind CSS (only) · Shadcn UI
> Read this file in full before generating any UI code.

---

## 1. Core Mandate

You are building an Order Management System for Tidal Vape. The aesthetic is Apple-like, minimalist, and strictly Black & White. Every visual decision must reinforce this identity.

**RULES:**
- All styling is done exclusively with Tailwind CSS utility classes
- No custom CSS files, no inline `style` props, no CSS-in-JS
- The only exception: Shadcn UI requires CSS custom properties in `globals.css` (see Section 3) — those variables are wiring for Shadcn internals, not a parallel styling system
- Never introduce color. The palette is zinc, neutral, black, and white only
- When in doubt: add more whitespace, use a lighter shade, keep it simple

---

## 2. Color Palette

The entire UI uses only these values. Memorize this table and reference it for every component.

| Role | Tailwind Class | Hex |
|------|---------------|-----|
| Page background | `bg-white` | #ffffff |
| Surface / Card | `bg-zinc-50` | #fafafa |
| Elevated surface | `bg-white` + shadow | #ffffff |
| Primary text | `text-zinc-900` | #18181b |
| Secondary text | `text-zinc-500` | #71717a |
| Muted text | `text-zinc-400` | #a1a1aa |
| Disabled text | `text-zinc-300` | #d4d4d8 |
| Border default | `border-zinc-200` | #e4e4e7 |
| Border subtle | `border-zinc-100` | #f4f4f5 |
| Divider | `divide-zinc-100` | #f4f4f5 |
| Hover background | `bg-zinc-100` | #f4f4f5 |
| Active/selected bg | `bg-zinc-900` | #18181b |
| Active/selected text | `text-white` | #ffffff |
| Input border | `border-zinc-300` | #d4d4d8 |
| Focus ring | `ring-2 ring-zinc-900 ring-offset-2` | — |
| CTA background | `bg-zinc-900` | #18181b |
| CTA text | `text-white` | #ffffff |
| Inverse surface | `bg-zinc-900` | #18181b |

**DON'T:**
```
DON'T: bg-blue-500, bg-indigo-600, text-green-600, border-red-300, or any non-zinc/neutral class
DON'T: Use Tailwind's default ring color — always override with ring-zinc-900
DON'T: Use opacity variants like text-zinc-900/50 — use the explicit zinc scale (zinc-400, zinc-300)
DON'T: Use bg-gray-* or bg-slate-* — use bg-zinc-* exclusively
DON'T: Use any color for error/destructive states — use zinc-900 ring or italic text
```

---

## 3. Shadcn CSS Variable Overrides

Place this block in `app/globals.css`. This remaps all Shadcn defaults to the B&W palette. **Do not add any other CSS to this file.** All component styling uses Tailwind classes.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 10% 3.9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 0% 15%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 0% 85%;
    --destructive-foreground: 240 10% 3.9%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 0 0% 83.1%;
  }
}
```

---

## 4. Typography

**Font Setup — `app/layout.tsx`:**
```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

// Apply to <html>: className={`${inter.variable} font-sans`}
```

**Tailwind config — `tailwind.config.ts`:**
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    },
  },
}
```

**Heading Scale:**
| Level | Classes | Usage |
|-------|---------|-------|
| H1 | `text-4xl font-semibold tracking-tight leading-[1.1]` | Page titles |
| H2 | `text-2xl font-semibold tracking-tight` | Section headers |
| H3 | `text-lg font-semibold` | Card titles |
| H4 | `text-base font-medium` | Sub-labels |

**Body & Label Scale:**
| Type | Classes | Usage |
|------|---------|-------|
| Body default | `text-sm text-zinc-600 leading-relaxed` | Descriptions, paragraphs |
| Body strong | `text-sm font-medium text-zinc-900` | Emphasis, selected states |
| Caption / Meta | `text-xs text-zinc-400 tracking-wide uppercase` | Timestamps, metadata |
| Uppercase label | `text-xs font-medium text-zinc-400 uppercase tracking-widest` | Form labels, section headings |
| Numeric / KPI | `text-zinc-900 font-semibold tabular-nums` | All numbers, prices, counts |
| Mono / ID | `font-mono text-xs text-zinc-500` | Order IDs, SKUs |

**DON'T:**
```
DON'T: font-bold on anything except large KPI numbers
DON'T: text-base or larger for table cell body copy
DON'T: Mix font families — Inter/Geist only throughout
DON'T: Use letter-spacing other than tracking-tight (headings) or tracking-widest (uppercase labels)
```

---

## 5. Spacing & Layout

**RULE:** Err on the side of more whitespace. Compressed layouts are explicitly forbidden.

| Context | Classes |
|---------|---------|
| Page container padding | `px-6 py-8` (min), `px-8 py-10` (preferred) |
| Between major sections | `space-y-8` |
| Between cards in a grid | `gap-4` or `gap-6` |
| Inside a card | `p-6` standard, `p-5` compact |
| Between form fields | `space-y-4` |
| Icon + label inline pair | `gap-2` |
| Table row min height | `min-h-[52px]` or `h-[52px]` |

**DON'T:**
```
DON'T: p-2 or p-3 on cards — minimum is p-5
DON'T: gap-1 between anything other than icon+label pairs
DON'T: Margins (mt-1, mb-2) on cards — use gap in the grid parent
```

---

## 6. Border Radius

| Element | Class |
|---------|-------|
| Cards / panels | `rounded-2xl` |
| Large modals | `rounded-3xl` |
| Buttons (standard) | `rounded-lg` |
| Inputs | `rounded-lg` |
| Badges / status chips | `rounded-full` |
| Tooltips | `rounded-xl` |
| Dropdown menu items | `rounded-md` |
| Avatars | `rounded-full` |
| Icon buttons | `rounded-lg` |

**DON'T:**
```
DON'T: rounded-sm on any card-level container
DON'T: Mix rounded-xl and rounded-2xl within the same card group
DON'T: rounded (bare) on cards — always be explicit with rounded-2xl
```

---

## 7. Box Shadows

| Level | Class | Usage |
|-------|-------|-------|
| Resting card | `shadow-sm` | Default card state |
| Hovered card | `shadow-md` | On hover with -translate-y-0.5 |
| Modal / sheet | `shadow-2xl` | Overlays |
| Dropdown | `shadow-lg` | Popovers, menus |
| Focus | `ring-2 ring-zinc-900 ring-offset-2` | Never a shadow — use ring |

**Custom shadow tokens — add to `tailwind.config.ts`:**
```ts
theme: {
  extend: {
    boxShadow: {
      card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      elevated: '0 4px 16px 0 rgb(0 0 0 / 0.08)',
    },
  },
}
```

**DON'T:**
```
DON'T: Colored shadows (shadow-blue-500/20, drop-shadow with color)
DON'T: drop-shadow filter utilities on card containers
DON'T: shadow-xl on cards — max is shadow-md for hovered state
```

---

## 8. Border Styles

| Context | Classes |
|---------|---------|
| Card border | `border border-zinc-200` |
| Section divider | `border-b border-zinc-100` |
| Table rows | `divide-y divide-zinc-100` (on `<tbody>`) |
| Input default | `border border-zinc-300` |
| Input focus | `focus:border-zinc-900` |
| Input error | `border-zinc-900 ring-1 ring-zinc-900` |

**DON'T:**
```
DON'T: border-2 or border-4 on structural elements
DON'T: Use ring without ring-zinc-900
DON'T: Full grid borders on tables — use divide-y only
```

---

## 9. Interactive State Summary

| State | Pattern |
|-------|---------|
| Hover (card) | `hover:shadow-md hover:-translate-y-0.5` |
| Hover (button) | `hover:opacity-90` |
| Hover (row/item) | `hover:bg-zinc-100` |
| Active (pressed) | `active:opacity-75` or `active:scale-[0.99]` |
| Focus (input/button) | `focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2` |
| Disabled | `opacity-40 cursor-not-allowed pointer-events-none` |
| Selected (nav/list) | `bg-zinc-900 text-white` |

All transitions: `transition-all duration-150` or `transition-colors duration-150`
