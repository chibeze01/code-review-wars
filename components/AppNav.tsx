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
    <nav className="sticky top-0 z-50 bg-cream border-b-2.5 border-ink">
      <div className="max-w-[1140px] mx-auto px-[22px] h-16 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink">
          <span className="w-[34px] h-[34px] border-2.5 border-ink rounded-[9px] bg-brand text-white grid place-items-center text-lg shadow-hard-sm">
            ⚔️
          </span>
          <span className="hidden sm:block">Code Review Wars</span>
        </Link>

        <div className="flex items-center gap-1 ml-2">
          {LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`font-semibold text-[14.5px] px-3 py-2 rounded-[9px] transition-colors ${
                  active ? 'bg-cream-2 text-ink' : 'text-ink-2 hover:text-ink hover:bg-cream-2'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/billing"
            className={`tag-pop ${credits === 0 ? 'bg-coral-soft' : ''}`}
          >
            ✨ {credits} credit{credits !== 1 ? 's' : ''}
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="font-semibold text-sm text-ink-3 hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
