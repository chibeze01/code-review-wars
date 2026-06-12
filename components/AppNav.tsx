'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/train', label: 'Train', exact: false },
  { href: '/dashboard/history', label: 'History', exact: false },
  { href: '/billing', label: 'Billing', exact: false },
]

interface Props {
  credits: number
}

export function AppNav({ credits }: Props) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#ccff00] flex items-center justify-center text-black font-black text-xs -skew-x-6">
            CR
          </div>
          <span className="text-sm font-black tracking-tight uppercase italic text-white hidden sm:block">
            Code Review <span className="text-[#ccff00]">Wars</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? 'text-black bg-[#ccff00] -skew-x-6'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className={active ? 'inline-block skew-x-6' : ''}>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/billing"
          className={`text-xs font-black uppercase italic px-3 py-1.5 -skew-x-6 border transition-colors ${
            credits === 0
              ? 'border-[#cf0a2c] text-[#cf0a2c] hover:bg-[#cf0a2c]/10'
              : 'border-[#ccff00]/50 text-[#ccff00] hover:bg-[#ccff00]/10'
          }`}
        >
          <span className="inline-block skew-x-6">{credits} credit{credits !== 1 ? 's' : ''}</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
