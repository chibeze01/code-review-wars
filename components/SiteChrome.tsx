import Link from 'next/link'
import { SITE } from '@/lib/site'

export const WRAP = 'max-w-[1140px] mx-auto px-[22px]'

export function Logo({ light = false, responsive = false }: { light?: boolean; responsive?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-display font-extrabold text-lg ${light ? 'text-white' : 'text-ink'}`}>
      <span className="w-[34px] h-[34px] border-2.5 border-ink rounded-[9px] bg-brand text-white grid place-items-center text-lg shadow-hard-sm">
        ⚔️
      </span>
      {/* Drop the wordmark on phones so the auth actions always fit. */}
      <span className={responsive ? 'hidden sm:inline' : ''}>{SITE.name}</span>
    </Link>
  )
}

const NAV_LINKS = [
  ['/#how', 'How it works'],
  ['/#features', 'Features'],
  ['/sample', 'Sample review'],
  ['/#pricing', 'Pricing'],
  ['/#faq', 'FAQ'],
]

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 bg-cream border-b-2.5 border-ink">
      <div className={`${WRAP} flex items-center gap-4 h-16`}>
        <Logo responsive />
        <div className="flex gap-1 ml-2.5 max-[900px]:hidden">
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-semibold text-[14.5px] text-ink-2 px-3 py-2 rounded-[9px] hover:text-ink hover:bg-cream-2 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/login" className="font-semibold text-[14.5px] text-ink-2 hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="btn-pop btn-pop-green btn-pop-sm">
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  )
}

// Compact legal row for pages that don't carry the full footer (auth, app).
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-ink-3 ${className}`}>
      <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
      <span className="mx-1.5">·</span>
      <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
      <span className="mx-1.5">·</span>
      <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ink transition-colors">{SITE.contactEmail}</a>
    </p>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-[#d6d3d1] py-12 pb-9">
      <div className={`${WRAP} flex flex-col gap-7`}>
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <Logo light />
          <div className="flex gap-[22px] text-sm flex-wrap">
            <a href="/#how" className="hover:text-white transition-colors">How it works</a>
            <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/sample" className="hover:text-white transition-colors">Sample review</Link>
            <Link href="/sources" className="hover:text-white transition-colors">Sources</Link>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex items-start justify-between gap-5 flex-wrap text-[13px] text-[#a8a29e]">
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-4 flex-wrap">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href={`mailto:${SITE.contactEmail}`} className="hover:text-white transition-colors">
                {SITE.contactEmail}
              </a>
            </div>
            <div>{SITE.tradingName}</div>
            <div>{SITE.tradingAddress}</div>
          </div>
          <div>© {new Date().getFullYear()} {SITE.name} · Built for devs who catch things.</div>
        </div>
      </div>
    </footer>
  )
}
