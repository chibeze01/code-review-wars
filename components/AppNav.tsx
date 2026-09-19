'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 bg-cream border-b-2.5 border-ink">
        <div className="max-w-[1140px] mx-auto px-[22px] h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink">
            <span className="w-[34px] h-[34px] border-2.5 border-ink rounded-[9px] bg-brand text-white grid place-items-center text-lg shadow-hard-sm">
              ⚔️
            </span>
            <span className="hidden sm:block">Code Review Wars</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
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

          {/* Right side: credits + sign out (desktop) */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/billing"
              className={`tag-pop ${credits === 0 ? 'bg-coral-soft' : ''}`}
            >
              ✨ {credits} credit{credits !== 1 ? 's' : ''}
            </Link>
            <form action="/api/auth/signout" method="post" className="hidden sm:block">
              <button
                type="submit"
                className="font-semibold text-sm text-ink-3 hover:text-ink transition-colors"
              >
                Sign out
              </button>
            </form>

            {/* Burger button — mobile only */}
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-[9px] border-2.5 border-ink bg-paper shadow-hard-sm active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
              <span
                className={`block w-4 h-[2px] bg-ink rounded-full transition-transform duration-200 ${
                  menuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`block w-4 h-[2px] bg-ink rounded-full transition-opacity duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-4 h-[2px] bg-ink rounded-full transition-transform duration-200 ${
                  menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t-2.5 border-ink bg-cream px-[22px] py-3 flex flex-col gap-1">
            {LINKS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-semibold text-[15px] px-3 py-2.5 rounded-[9px] transition-colors ${
                    active ? 'bg-cream-2 text-ink' : 'text-ink-2 hover:text-ink hover:bg-cream-2'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <div className="mt-2 pt-2 border-t border-ink/10">
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="font-semibold text-sm text-ink-3 hover:text-ink transition-colors px-3 py-2"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay to close menu when tapping outside — mobile only */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
