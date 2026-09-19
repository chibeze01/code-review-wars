import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav, SiteFooter, WRAP } from '@/components/SiteChrome'
import { StaticCodeListing } from '@/components/StaticCodeListing'
import { GradedReview } from '@/components/GradedReview'
import { SAMPLE } from '@/lib/sampleReview'
import { PRODUCT_FACTS, formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sample graded code review',
  description:
    'A complete Code Review Wars session, no signup: the generated TypeScript challenge, a strong reviewer’s inline comments, and the AI staff-engineer grade — issues found, missed, false positives, honor score and model answer.',
  openGraph: {
    title: 'Sample graded code review — Code Review Wars',
    description:
      'One full session, fully graded, no account needed. See exactly how the review round gets scored.',
  },
}

export default function SamplePage() {
  const { challenge, comments, generalNotes, evaluation, gradedAt, model } = SAMPLE

  return (
    <div className="bg-cream text-ink min-h-screen">
      <SiteNav />

      <main className={`${WRAP} py-14`}>
        <div className="max-w-3xl mx-auto">
          <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">worked example</div>
          <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3">
            One review, <span className="mark-hi">fully graded.</span>
          </h1>
          <p className="text-lg text-ink-2 leading-[1.6] mt-4">
            This is a complete session exactly as it appears in the product: a generated challenge, a strong
            reviewer&apos;s inline comments, and the grader&apos;s verdict. Live sessions generate fresh code every
            time — this one is frozen so you can read it without signing up.
          </p>
          <p className="text-[13.5px] text-ink-3 mt-3">
            Example last updated {formatDate(gradedAt)}. Live sessions are graded by {model} with the same
            rubric shown here.
          </p>
        </div>

        {/* Scenario */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="card-pop !shadow-hard-sm border-l-[6px] border-l-brand px-4 py-3">
            <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mb-1">🎯 Scenario</p>
            <p className="text-sm text-ink-2 leading-relaxed">{challenge.scenario}</p>
          </div>
        </div>

        {/* Code + review */}
        <section className="max-w-3xl mx-auto mt-10">
          <h2 className="font-display font-extrabold text-2xl mb-1">1. The challenge, with the review inline</h2>
          <p className="text-sm text-ink-2 mb-5">
            Reviewers click a line number to drop a comment, just like a pull request. Each card below sits
            where the reviewer left it.
          </p>
          <StaticCodeListing code={challenge.code} language={challenge.language} comments={comments} />

          <div className="mt-5 flex flex-col gap-1">
            <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">General notes submitted</p>
            <p className="text-xs text-ink-2 leading-relaxed font-mono bg-cream-2 border-2 border-ink rounded-lg px-3 py-2 whitespace-pre-wrap">
              {generalNotes}
            </p>
          </div>
        </section>

        {/* Grade */}
        <section className="max-w-3xl mx-auto mt-14">
          <h2 className="font-display font-extrabold text-2xl mb-1">2. The grade</h2>
          <p className="text-sm text-ink-2 mb-5">
            Score is against the planted issues only, weighted by severity. Flagging something that isn&apos;t
            a problem costs points; catching a real flaw we never planted earns a bonus. Honor accrues one-to-one
            with score and drives the rank ladder.
          </p>
          <GradedReview result={evaluation} issues={challenge.issues} honorEarned={evaluation.score} />
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto mt-16 text-center bg-brand border-2.5 border-ink rounded-pop-xl shadow-hard-lg text-white px-6 py-12">
          <h2 className="font-display font-extrabold leading-[1.04] text-[clamp(26px,4vw,38px)]">
            Now try it on code you haven&apos;t seen.
          </h2>
          <p className="text-[#eafff0] leading-[1.6] max-w-[460px] mx-auto mt-3">
            {PRODUCT_FACTS.freeCredits} free sessions. No card. Fresh code every time.
          </p>
          <div className="mt-7">
            <Link href="/signup" className="btn-pop btn-pop-yellow btn-pop-lg">
              ⚡ Start catching bugs — free
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
