import Link from 'next/link'

/**
 * Full-screen notice shown in place of width-hungry screens (e.g. the training
 * arena) on phones. Rendered alongside the real UI and toggled purely with
 * Tailwind responsive utilities (`md:hidden` here, `hidden md:block` on the
 * sibling) so it stays SSR-correct with no hydration flash.
 */
export function SmallScreenNotice() {
  return (
    <div className="md:hidden min-h-screen bg-cream text-ink flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="card-pop p-7 max-w-sm w-full flex flex-col items-center gap-4">
        <span className="w-[52px] h-[52px] border-2.5 border-ink rounded-[13px] bg-brand text-white grid place-items-center text-2xl shadow-hard-sm">
          🖥️
        </span>
        <div className="tag-pop">⚔️ The review arena</div>
        <h1 className="font-display font-extrabold text-2xl leading-[1.1]">
          Training needs a <span className="mark-hi">bigger screen.</span>
        </h1>
        <p className="text-ink-2 text-[15px] leading-relaxed">
          The arena puts a full code editor and inline annotations side-by-side with your
          session panel — more room than a phone can give. Open Code Review Wars on a tablet,
          laptop, or desktop to start catching bugs.
        </p>
        <Link href="/dashboard" className="btn-pop btn-pop-green btn-pop-sm mt-1">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
