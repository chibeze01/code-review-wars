import Link from 'next/link'
import { SiteNav, SiteFooter, WRAP } from '@/components/SiteChrome'
import { LogoStrip } from '@/components/LogoStrip'
import { getPublicCounters, showCounter } from '@/lib/counters'
import { SITE, PRODUCT_FACTS, formatDate } from '@/lib/site'

/* ────────────────────────────────────────────────────────────────────────────
   Landing page — "indie" design (Marc Lou style).
   No testimonials, ratings or user counts: the product has no users to quote
   yet. Social proof is product facts, cited third-party evidence (/sources),
   a public graded example (/sample) and live counters that only render once
   they are real.
──────────────────────────────────────────────────────────────────────────── */

// Counters come from the DB; re-render at most every 5 minutes.
export const revalidate = 300

const PAIN_CARDS = [
  {
    emoji: '😰',
    title: 'You blank on a 200-line PR',
    body: 'The interviewer shares a diff and the clock starts. Where do you even look first?',
  },
  {
    emoji: '🐛',
    title: 'You spot the typo, miss the time-bomb',
    body: 'Nice catch on the naming. Shame about the SQL injection and the race condition.',
  },
  {
    emoji: '🥱',
    title: 'Every LeetCode clone ignores review',
    body: "You've ground 500 algo problems. None of them taught you to read someone else's code.",
  },
]

const STEPS = [
  {
    emoji: '🎯',
    title: 'Pick your poison',
    body: 'Pick a language — TypeScript, Python, Java, C#, C++, Go, Rust, SQL — and the kind of system: fintech, healthcare, e-commerce. We generate real code that fits, with bugs baked in.',
  },
  {
    emoji: '🔍',
    title: 'Review like a real PR',
    body: "Click any line to drop an inline comment. Flag the injection, the N+1, the broken auth — exactly how you'd review a teammate.",
  },
  {
    emoji: '🏆',
    title: 'Get graded instantly',
    body: 'An AI staff engineer scores your review, shows what you missed, and coaches you up.',
    link: { href: '/sample', label: 'See a graded example →' },
  },
]

const FEATURES = [
  {
    emoji: '🐛',
    tile: 'bg-coral-soft',
    title: 'Real hidden flaws',
    body: 'Subtle bugs, injection, race conditions and N+1s — the stuff that actually slips into prod, not contrived puzzles.',
  },
  {
    emoji: '⚖️',
    tile: 'bg-hi-soft',
    title: 'Severity-weighted scoring',
    body: 'Critical issues score more than nits. Learn to triage like the clock is ticking and the on-call pager is hot.',
  },
  {
    emoji: '📊',
    tile: 'bg-brand-soft',
    title: 'Track your eye',
    body: "A GitHub-style heatmap, per-category skills and streaks show exactly where you're sharp — and where you're soft.",
  },
  {
    emoji: '🏅',
    tile: 'bg-[#dbeafe]',
    title: 'Climb the ranks',
    body: 'A Codewars-style ladder from 8 kyu to 1 dan. Ranked on accuracy and severity, not just speed.',
  },
  {
    emoji: '✨',
    tile: 'bg-[#ede9fe]',
    title: 'Model answer every time',
    body: 'See the ideal review after every session. Learn the senior-engineer reasoning, then go again.',
  },
  {
    emoji: '🎓',
    tile: 'bg-coral-soft',
    title: 'Coaching that sticks',
    body: 'Specific, actionable feedback on every review — what you caught, what you missed, and how to level up.',
  },
]

// Real Stripe packs — keep in sync with /api/stripe/checkout
const PACKS = [
  {
    name: 'Starter',
    price: '$5',
    credits: '10 credits',
    popular: false,
    features: ['10 full review sessions', 'All languages & domains', 'Heatmap + skill tracking', 'Credits never expire'],
    cta: 'Get Starter',
  },
  {
    name: 'Standard',
    price: '$18',
    credits: '50 credits',
    popular: true,
    features: ['50 full review sessions', 'Everything in Starter', 'Rank ladder to 1 dan', 'Best price-per-review'],
    cta: 'Get Standard →',
  },
  {
    name: 'Pro',
    price: '$45',
    credits: '150 credits',
    popular: false,
    features: ['150 full review sessions', 'Everything in Standard', 'Early access to new domains', 'Train forever'],
    cta: 'Get Pro',
  },
]

const FAQS = [
  {
    q: 'Is this just LeetCode with extra steps?',
    a: "Nope — the opposite. LeetCode trains you to write algorithms from scratch. Code Review Wars trains you to read real, messy production code under pressure and catch what's wrong. It's the skill the review round actually tests.",
    open: true,
  },
  {
    q: 'Which languages are supported?',
    a: 'TypeScript, JavaScript, Python, Java, C#, C++, Go, Rust and SQL — including the stack banks and trading desks actually review in. All of them work across domains like fintech, healthcare, e-commerce and realtime systems.',
    open: false,
  },
  {
    q: 'Do credits expire?',
    a: 'Never. Buy a pack once and use it whenever you\'re prepping. No subscription, no monthly drip, no "use it or lose it."',
    open: false,
  },
  {
    q: 'How does the AI grading work?',
    a: 'Each challenge has real flaws planted with known severity. When you submit, we match your inline comments against them — rewarding correct catches, weighting by severity, and docking false positives.',
    open: false,
  },
  {
    q: 'Will this actually help me pass interviews?',
    a: "That's the whole point. Reading and reviewing code is the one thing you do every single day at work — and the round almost nobody preps for. Three free sessions means there's zero risk in finding out.",
    open: false,
  },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="laurel-leading laurel-trailing font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">{children}</div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3">
      {children}
    </h2>
  )
}

function HeroMock() {
  return (
    <div className="relative">
      {/* doodle arrow + handwritten label */}
      <svg
        className="absolute pointer-events-none -top-[46px] -left-[30px] w-[120px] h-[90px] max-lg:hidden"
        viewBox="0 0 120 90"
        fill="none"
      >
        <path d="M8 14 C50 2 96 18 92 64" stroke="#ff6a3d" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M78 54 L94 66 L101 48" stroke="#ff6a3d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -top-[58px] left-[78px] font-display font-bold text-coral text-[15px] -rotate-6 max-lg:hidden">
        real bugs, graded live!
      </span>

      <div className="bg-paper border-2.5 border-ink rounded-pop-lg shadow-hard-lg overflow-hidden rotate-2">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-[15px] py-[11px] border-b-2.5 border-ink bg-cream-2">
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-coral" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-hi" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-brand" />
          <span className="font-mono text-xs text-ink-2 ml-1.5">checkout.ts</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-display font-extrabold text-xs px-3 py-1 rounded-full bg-brand-soft">
            Grade A
          </span>
        </div>
        {/* code */}
        <div className="font-mono text-[12.5px] leading-[1.9] py-1.5">
          <div className="flex px-3.5">
            <span className="w-[26px] text-ink-3 flex-none">3</span>
            <span><span className="text-accent-purple font-bold">const</span> cart = <span className="text-accent-purple font-bold">await</span> db.query(</span>
          </div>
          <div className="flex px-3.5 bg-coral-soft">
            <span className="w-[26px] text-ink-3 flex-none">4</span>
            <span>&nbsp;&nbsp;<span className="text-brand-dark">{'`SELECT * FROM carts WHERE id=${id}`'}</span>)</span>
          </div>
          <div className="flex px-3.5">
            <span className="w-[26px] text-ink-3 flex-none">6</span>
            <span><span className="text-accent-purple font-bold">for</span> (<span className="text-accent-purple font-bold">const</span> i <span className="text-accent-purple font-bold">of</span> cart.items) {'{'}</span>
          </div>
          <div className="flex px-3.5 bg-hi-soft">
            <span className="w-[26px] text-ink-3 flex-none">7</span>
            <span>&nbsp;&nbsp;<span className="text-accent-purple font-bold">await</span> db.getProduct(i.id) <span className="text-ink-3 italic">{'// N+1'}</span></span>
          </div>
          <div className="flex px-3.5">
            <span className="w-[26px] text-ink-3 flex-none">9</span>
            <span>db.orders.insert({'{'} status:<span className="text-brand-dark">&apos;paid&apos;</span> {'}'})</span>
          </div>
        </div>
        {/* inline note */}
        <div className="mx-3.5 mt-1 border-l-4 border-coral bg-coral-soft rounded-r-lg px-3 py-2 text-[12.5px] font-medium">
          🛡️ <b>Line 4:</b> SQL injection — <code className="font-mono">id</code> is interpolated straight into the query.
        </div>
        {/* footer */}
        <div className="flex items-center justify-between gap-2.5 px-[15px] py-[13px] border-t-2.5 border-ink mt-3 bg-brand-soft">
          <span className="font-display font-extrabold text-sm">✅ 5 of 6 issues caught</span>
          <span className="font-mono font-bold text-[13px]">+85 honor</span>
        </div>
      </div>
    </div>
  )
}

function Stat({ big, rest }: { big: string; rest: string }) {
  return (
    <div>
      <span className="text-[26px] text-ink">{big}</span> {rest}
    </div>
  )
}

export default async function LandingPage() {
  const counters = await getPublicCounters()
  const { languages, domains, bugsPerChallenge, ranks, freeCredits } = PRODUCT_FACTS
  const fmt = (n: number) => n.toLocaleString('en-GB')

  const stats: [string, string][] = [
    [`${languages} languages`, `· ${domains} domains`],
    [`${bugsPerChallenge.min}–${bugsPerChallenge.max}`, 'bugs per challenge'],
    [`${ranks} ranks`, 'to climb'],
    [`${freeCredits} free`, 'sessions to start'],
  ]
  if (showCounter(counters?.plantedFlaws)) stats.push([fmt(counters.plantedFlaws), 'planted flaws in the bank'])
  if (showCounter(counters?.reviewsGraded)) stats.push([fmt(counters.reviewsGraded), 'reviews graded'])
  if (showCounter(counters?.bugsCaught)) stats.push([fmt(counters.bugsCaught), 'bugs caught in review'])

  return (
    <div className="bg-cream text-ink">
      <SiteNav />

      {/* ── Hero ── */}
      <header className="pt-16 pb-[70px]">
        <div className={`${WRAP} grid grid-cols-[1.05fr_0.95fr] max-[900px]:grid-cols-1 gap-12 items-center`}>
          <div>
            <div className="tag-pop mb-[22px]">🎯 Built specifically for the code review round</div>
            <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(26px,7vw,62px)]">
              Become the dev who catches the bug{' '}
              <br className="block sm:hidden" />
              <span className="mark-hi">everyone else merged.</span>
            </h1>
            <p className="text-xl text-ink-2 leading-[1.6] mt-[22px] max-w-[520px]">
              Code Review Wars throws <b>real, messy production code</b> at you — with nasty bugs hidden
              inside — then grades your review like a staff engineer. Get sharp. Get hired.
            </p>
            <div className="flex items-center gap-4 mt-[30px] flex-wrap">
              <Link href="/signup" className="btn-pop btn-pop-green btn-pop-lg">
                ⚡ Start catching bugs — free
              </Link>
              <Link href="/sample" className="btn-pop btn-pop-lg">
                See a graded review
              </Link>
            </div>
            <p className="text-[13.5px] text-ink-2 font-medium mt-3.5">
              ✅ {freeCredits} free reviews &nbsp;•&nbsp; no credit card &nbsp;•&nbsp; one-time pricing, no subscription
            </p>
          </div>

          <HeroMock />
        </div>
      </header>

      {/* ── Product facts ── */}
      <div className="bg-cream-2 border-y-2.5 border-ink py-6">
        <div className={`${WRAP} flex items-center justify-center gap-x-[38px] gap-y-3 flex-wrap font-display font-bold text-[15px] text-ink-2`}>
          {stats.map(([big, rest], i) => (
            <div key={big} className="contents">
              {i > 0 && <div className="hidden sm:block">•</div>}
              <Stat big={big} rest={rest} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Pain ── */}
      <section className="bg-paper border-t-2.5 border-ink py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>sound familiar?</Eyebrow>
          <SectionHeading>
            The review round is where good devs <span className="u-wave">freeze.</span>
          </SectionHeading>
          <div className="grid grid-cols-3 max-[900px]:grid-cols-1 gap-[18px] mt-[42px] text-left">
            {PAIN_CARDS.map((c) => (
              <div key={c.title} className="p-6 bg-cream border-2.5 border-ink rounded-pop-lg shadow-hard">
                <div className="w-[38px] h-[38px] rounded-[10px] border-2.5 border-ink bg-coral-soft grid place-items-center text-xl mb-3.5">
                  {c.emoji}
                </div>
                <h3 className="font-display font-extrabold text-lg mb-2">{c.title}</h3>
                <p className="text-ink-2 text-[14.5px]">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="font-display font-bold text-[22px] mt-10">There&apos;s a better way to train 👇</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>how it works</Eyebrow>
          <SectionHeading>
            Three steps. <span className="mark-hi mark-green">Real reps.</span>
          </SectionHeading>
          <p className="text-lg text-ink-2 leading-[1.6] max-w-[560px] mx-auto mt-4">
            No toy puzzles. Every session is fresh, production-style code from a domain you pick.
          </p>
          <div className="grid grid-cols-3 max-[900px]:grid-cols-1 gap-[22px] mt-[50px] text-left">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative p-7 px-6 bg-paper border-2.5 border-ink rounded-pop-lg shadow-hard">
                <span className="absolute -top-[18px] -left-3 w-[46px] h-[46px] rounded-full border-2.5 border-ink bg-hi grid place-items-center font-display font-extrabold text-xl shadow-hard-sm">
                  {i + 1}
                </span>
                <span className="text-[38px] block mb-3.5">{s.emoji}</span>
                <h3 className="font-display font-extrabold text-[21px] mb-2">{s.title}</h3>
                <p className="text-ink-2 text-[14.5px]">{s.body}</p>
                {s.link && (
                  <Link href={s.link.href} className="inline-block mt-3.5 font-display font-bold text-[14.5px] text-brand hover:underline">
                    {s.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-cream-2 border-y-2.5 border-ink py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>why it works</Eyebrow>
          <SectionHeading>
            Built to make you <span className="mark-hi mark-coral">dangerous</span> in review
          </SectionHeading>
          <div className="grid grid-cols-3 max-[900px]:grid-cols-1 gap-[18px] mt-12 text-left">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 bg-paper border-2.5 border-ink rounded-pop-lg shadow-hard">
                <div className={`w-[52px] h-[52px] rounded-[13px] border-2.5 border-ink grid place-items-center text-[26px] mb-4 shadow-hard-sm ${f.tile}`}>
                  {f.emoji}
                </div>
                <h4 className="font-display font-extrabold text-lg mb-2">{f.title}</h4>
                <p className="text-ink-2 text-sm">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where the review round shows up ── */}
      <section id="where" className="py-[72px]">
        <div className={`${WRAP} text-center`}>
          <div className="font-display font-bold text-[13px] text-ink-3 uppercase tracking-[0.1em]">the format, not us</div>
          <SectionHeading>Code review rounds are run at</SectionHeading>
          <LogoStrip />
        </div>
      </section>

      {/* ── Founder note ── */}
      <section className="bg-paper border-t-2.5 border-ink py-[84px]">
        <div className={WRAP}>
          <div className="max-w-[780px] mx-auto p-9 bg-cream border-2.5 border-ink rounded-pop-xl shadow-hard-lg">
            <div className="flex items-center gap-3.5 mb-2">
              <span className="av-pop !w-[54px] !h-[54px] !text-lg bg-brand text-white">
                {SITE.founderFirstName[0]}
              </span>
              <div>
                <div className="font-display font-extrabold text-lg">A note from the founder 👋</div>
                <div className="text-[13px] text-ink-3">Built solo · launched {SITE.launchMonth}</div>
              </div>
            </div>
            <p className="text-base text-ink-2 leading-[1.7] mt-2">
              Hey — I built Code Review Wars after watching brilliant engineers (myself included) freeze
              the second an interviewer shared a pull request. We grind algorithms for months and spend{' '}
              <i>zero</i> time on the one thing we do every single day at work: reading and reviewing other
              people&apos;s code.
            </p>
            <p className="text-base text-ink-2 leading-[1.7] mt-3.5">
              So I made the tool I wish I&apos;d had — real code, real bugs, instant feedback. No fluff, no
              subscription. Just reps until catching the bug becomes reflex.
            </p>
            <p className="text-base text-ink-2 leading-[1.7] mt-3.5">
              Built solo and launched this month. No users to quote yet, so there are {freeCredits} free
              sessions instead — <Link href="/sample" className="font-bold text-ink underline decoration-2 underline-offset-[3px] hover:text-brand">judge it yourself</Link>.
            </p>
            <div className="font-display font-extrabold text-[22px] mt-3.5">— {SITE.founderFirstName}</div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-cream-2 border-y-2.5 border-ink py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>pricing</Eyebrow>
          <SectionHeading>
            Pay once. <span className="mark-hi mark-green">Train forever.</span>
          </SectionHeading>
          <p className="text-lg text-ink-2 leading-[1.6] max-w-[540px] mx-auto mt-4">
            1 credit = 1 full session: code generation + AI grading. No subscription. Credits never expire.
          </p>
          <div className="grid grid-cols-3 max-[900px]:grid-cols-1 gap-5 mt-12 text-left items-start">
            {PACKS.map((p) => (
              <div
                key={p.name}
                className={`relative p-7 bg-paper border-2.5 rounded-pop-lg ${
                  p.popular ? 'border-brand shadow-hard-lg -translate-y-1.5' : 'border-ink shadow-hard'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white font-display font-extrabold text-xs px-4 py-1.5 border-2.5 border-ink rounded-full shadow-hard-sm whitespace-nowrap">
                    🔥 MOST POPULAR
                  </span>
                )}
                <h3 className="font-display font-extrabold text-[22px]">{p.name}</h3>
                <div className="flex items-baseline gap-2 mt-3.5 mb-1">
                  <span className="font-display font-extrabold text-[46px]">{p.price}</span>
                </div>
                <div className="font-bold text-brand text-[15px]">{p.credits}</div>
                <div className="text-xs text-ink-3 mt-1">Launch price until {formatDate(SITE.launchPriceEnds)}</div>
                <ul className="my-5 flex flex-col gap-[11px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 items-start text-[14.5px]">
                      <span className="text-brand font-extrabold flex-none">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`btn-pop w-full ${p.popular ? 'btn-pop-green' : ''}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 mt-[30px] font-semibold text-[14.5px] px-[18px] py-[11px] border-2.5 border-ink rounded-full bg-brand-soft shadow-hard-sm">
            ✅ Start with {freeCredits} free sessions — no card required.
          </div>
          <p className="text-[13.5px] text-ink-2 mt-4 max-w-[520px] mx-auto">
            Purchased credits are non-refundable — that&apos;s what the free sessions are for. Details in the{' '}
            <Link href="/terms" className="underline decoration-2 underline-offset-[3px] hover:text-ink">Terms</Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>questions?</Eyebrow>
          <SectionHeading>Frequently asked</SectionHeading>
          <div className="max-w-[760px] mx-auto mt-[42px] flex flex-col gap-3.5 text-left">
            {FAQS.map((f) => (
              <details
                key={f.q}
                open={f.open}
                className="group bg-paper border-2.5 border-ink rounded-pop shadow-hard-sm overflow-hidden"
              >
                <summary className="list-none cursor-pointer px-[22px] py-[18px] font-display font-bold text-[17px] flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-2xl flex-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-[22px] pb-5 text-ink-2 text-[15px] leading-[1.6]">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-brand border-t-2.5 border-ink text-white text-center py-[84px]">
        <div className={WRAP}>
          <h2 className="font-display font-extrabold leading-[1.04] text-[clamp(32px,5vw,52px)]">
            Your next interview has a<br />code review round.
          </h2>
          <p className="text-[19px] text-[#eafff0] leading-[1.6] max-w-[520px] mx-auto mt-[18px]">
            Walk in having reviewed a hundred bugs. Start free — {freeCredits} reviews on the house, no card.
          </p>
          <div className="mt-8 flex gap-3.5 justify-center flex-wrap">
            <Link href="/signup" className="btn-pop btn-pop-yellow btn-pop-lg">
              ⚡ Start catching bugs — free
            </Link>
          </div>
          <p className="mt-4 text-[#eafff0] font-semibold text-sm">
            No subscription. No card. Credits never expire.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
