'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'
import {
  LayoutDashboard, Users, Building2,
  Briefcase, TrendingUp, Wallet,
  Settings, LogOut, User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/leads',       icon: Users,           label: 'Leads'       },
  { href: '/properties',  icon: Building2,       label: 'Properties'  },
  { href: '/deals',       icon: Briefcase,       label: 'Deals'       },
  { href: '/investments', icon: TrendingUp,      label: 'Investments' },
  { href: '/wealth',      icon: Wallet,          label: 'Wealth'      },
]

// ─── DESKTOP SIDEBAR ─────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <nav className="hidden md:flex h-screen w-56 flex-col border-r border-zinc-200 bg-white px-3 py-5 shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 mb-7">
        <div className="h-7 w-7 rounded-lg bg-zinc-900 shrink-0 flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-none">SK Properties</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Mohan Garden</p>
        </div>
      </div>

      {/* Nav links */}
      <ul className="flex-1 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
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

      {/* Bottom */}
      <div className="border-t border-zinc-100 pt-3 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors duration-150"
        >
          <Settings className="h-4 w-4 text-zinc-400" />
          Settings
        </Link>

        {/* User + logout */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 transition-colors group cursor-default">
          <div className="h-7 w-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-zinc-400 capitalize">{user?.role || 'operator'}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 transition-all"
          >
            <LogOut className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
const mobileItems = navItems.slice(0, 5) // Dashboard, Leads, Properties, Deals, Investments

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-30 safe-b">
      <ul className="flex">
        {mobileItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors duration-150',
                  isActive ? 'text-zinc-900' : 'text-zinc-400'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
