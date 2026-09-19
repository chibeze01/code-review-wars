import type { Metadata } from 'next'
import { SiteNav, SiteFooter, WRAP } from '@/components/SiteChrome'
import { SITE, formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sources — where the code review round shows up',
  description:
    'The evidence behind our claim that Airbnb, Meta and Google run code-review or code-comprehension interview rounds: dated candidate reports and interview guides, with links, and how strong each one is.',
  openGraph: {
    title: 'Sources — Code Review Wars',
    description: 'Every company we name on the landing page, with the candidate reports and guides that back it up.',
  },
}

const ACCESSED = '2026-09-13'

interface Source {
  outlet: string
  title: string
  url: string
  date: string
  note: string
}

interface Company {
  name: string
  claim: string
  strength: string
  sources: Source[]
}

const COMPANIES: Company[] = [
  {
    name: 'Airbnb',
    claim: 'Airbnb runs a dedicated, rubric-scored code review round in its software engineering loop.',
    strength:
      'Strong. Two first-hand candidate accounts plus two independent interview guides, one of which quotes an Airbnb interviewer who helped build the round.',
    sources: [
      {
        outlet: 'Blind',
        title: '“Interviewing at Airbnb” — community thread, reply from a candidate',
        url: 'https://www.teamblind.com/post/interviewing-at-airbnb-g58oa2au',
        date: 'Reply dated 5 April 2026',
        note: '“They have something unique called code review rounds where an engineer silently watches you review code while sharing screen. They usually have 3 pull requests to review here and first one is too small in scope and very easy.”',
      },
      {
        outlet: 'Blind',
        title: '“AirBnb Senior Onsite Interview Rejection” — candidate write-up',
        url: 'https://www.teamblind.com/post/5OuBma7G',
        date: '27 August 2024',
        note: '“Code Review: You get a GitHub repo with 3 pull requests. What they don’t tell you is that you score ‘points’ for making comments on various issues about the code.”',
      },
      {
        outlet: 'Exponent',
        title: '“How to Ace a Code Review Interview” — guide quoting an Airbnb interviewer who helped design the round',
        url: 'https://www.tryexponent.com/blog/how-to-ace-a-code-review',
        date: 'Updated mid-2026',
        note: 'Describes a formal, rubric-scored code review round used from senior through staff level: three questions drawn from an approved bank in Java or Python, scored on communication, teamwork, execution and depth of knowledge rather than raw issue count.',
      },
      {
        outlet: 'Hello Interview',
        title: 'Airbnb G9 (senior) interview guide',
        url: 'https://www.hellointerview.com/guides/airbnb/g9',
        date: '2026 edition',
        note: '“Airbnb introduced this round in 2024 to replace the traditional second coding interview.” Describes a 60-minute round reviewing pre-written code for bugs, edge cases and maintainability.',
      },
    ],
  },
  {
    name: 'Meta',
    claim: 'Meta has used code review as an interview format.',
    strength:
      'Strong for production-engineering loops, where a candidate reports code review substituting for coding rounds. We do not claim it is universal across every Meta level or track. Meta’s newer AI-enabled round tests reading an existing codebase but is not a pull-request review.',
    sources: [
      {
        outlet: 'Exponent',
        title: '“How to Ace a Code Review Interview” — compiled candidate accounts',
        url: 'https://www.tryexponent.com/blog/how-to-ace-a-code-review',
        date: 'Updated mid-2026',
        note: 'A Meta production-engineering candidate reports that code review rounds substitute for coding rounds in their loop, and that Meta now allows an AI code assistant in the round.',
      },
      {
        outlet: 'Hello Interview',
        title: '“Meta’s AI-Enabled Coding Interview: How to Prepare”',
        url: 'https://www.hellointerview.com/blog/meta-ai-enabled-coding',
        date: 'Rollout began October 2025',
        note: '“In October 2025, Meta started rolling out a new interview type called AI-enabled coding.” Candidates work in “a multi-file project, with existing classes, data models, and logic already written. You didn’t write any of this code.”',
      },
    ],
  },
  {
    name: 'Google',
    claim:
      'Google’s loop includes a code comprehension / debugging exercise that tests the same skill: reading someone else’s code, finding what is wrong, and fixing it.',
    strength:
      'Moderate. Google’s format is a debugging exercise on broken code — not a pull-request review. The skill under test is the same; the format is not identical, and we say so.',
    sources: [
      {
        outlet: 'Exponent',
        title: '“How to Ace a Code Review Interview” — compiled candidate accounts',
        url: 'https://www.tryexponent.com/blog/how-to-ace-a-code-review',
        date: 'Updated mid-2026',
        note: 'An L6 engineering-manager candidate was given “more than 200 lines of broken code in a Google Doc, with no IDE and no AI tools” and asked to review, comment, fix defects and reason through test cases by hand.',
      },
      {
        outlet: 'Exponent',
        title: '“Google’s AI-Assisted Coding Interview (2026 Guide)”',
        url: 'https://www.tryexponent.com/blog/google-ai-coding-interview',
        date: 'Updated 2026',
        note: 'Describes a code comprehension round built on “reading, debugging, and optimizing real code with Gemini available as an AI assistant”, piloted for junior and mid-level roles on select US teams.',
      },
    ],
  },
]

export default function SourcesPage() {
  return (
    <div className="bg-cream text-ink min-h-screen">
      <SiteNav />

      <main className={`${WRAP} py-14`}>
        <div className="max-w-3xl mx-auto">
          <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">sources</div>
          <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3">
            Where the review round <span className="mark-hi">shows up.</span>
          </h1>
          <p className="text-lg text-ink-2 leading-[1.6] mt-4">
            The landing page says code review rounds are run at Airbnb, Meta and Google. This page is the
            evidence for that claim — what each source actually says, when it said it, and how much weight we
            put on it.
          </p>

          <div className="mt-7 p-5 bg-hi-soft border-2.5 border-ink rounded-pop-lg shadow-hard-sm text-[15px] leading-[1.6]">
            <p className="font-display font-bold mb-1.5">Read this first</p>
            <p className="text-ink-2">
              Several large companies, Airbnb among them, publish little or nothing official about their
              interview loops. Every claim below rests on publicly posted candidate reports and third-party
              interview guides, not on company statements. Interview formats change; a report from 2024 may
              not describe a loop in 2027.
            </p>
            <p className="text-ink-2 mt-2">
              None of these companies is affiliated with, sponsors, or endorses {SITE.name}. Their names and
              logos appear only to identify where the interview format exists.
            </p>
          </div>

          <p className="text-[13.5px] text-ink-3 mt-5">
            All sources accessed {formatDate(ACCESSED)} · Page last reviewed {formatDate(SITE.lastReviewed)}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12 flex flex-col gap-10">
          {COMPANIES.map((c) => (
            <section key={c.name} id={c.name.toLowerCase()} className="card-pop p-7">
              <h2 className="font-display font-extrabold text-[28px]">{c.name}</h2>

              <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mt-5 mb-1">Claim</p>
              <p className="text-[15px] leading-[1.6]">{c.claim}</p>

              <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mt-5 mb-2">Evidence</p>
              <ol className="flex flex-col gap-4">
                {c.sources.map((s) => (
                  <li key={s.url} className="border-l-[3px] border-ink/20 pl-4">
                    <div className="text-[13px] text-ink-3 font-semibold">{s.outlet} · {s.date}</div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-semibold underline decoration-2 underline-offset-[3px] hover:text-brand transition-colors break-words"
                    >
                      {s.title} ↗
                    </a>
                    <p className="text-[14.5px] text-ink-2 leading-[1.6] mt-1.5">{s.note}</p>
                  </li>
                ))}
              </ol>

              <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mt-5 mb-1">Strength</p>
              <p className="text-[15px] text-ink-2 leading-[1.6]">{c.strength}</p>
            </section>
          ))}

          <section className="border-2 border-dashed border-ink/30 rounded-pop-lg p-7">
            <h2 className="font-display font-extrabold text-[22px]">Apple — assessed, not shown</h2>
            <p className="text-[15px] text-ink-2 leading-[1.6] mt-3">
              In the same Exponent compilation, an Apple M1 engineering-manager candidate&apos;s round labelled
              &ldquo;code review&rdquo; was a from-scratch coding problem on CoderPad (validating a completed
              Sudoku grid) followed by an optimisation discussion. One account of a coding problem is not
              evidence of a code-review round, so Apple is not on the landing page.
            </p>
          </section>

          <p className="text-[13.5px] text-ink-3">
            Spotted an error, or have a first-hand account we should add?{' '}
            <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-ink">{SITE.contactEmail}</a>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
