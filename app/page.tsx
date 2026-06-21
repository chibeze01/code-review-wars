'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────────────────
   Landing page — "indie" design (Marc Lou style).
   Reference: handoff landing-indie.html. Copy is verbatim from the handoff;
   pricing uses the real Stripe packs so checkout always matches the marketing.
──────────────────────────────────────────────────────────────────────────── */

const WRAP = 'max-w-[1140px] mx-auto px-[22px]'

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
    body: 'Choose TypeScript or C# and the kind of system — fintech, healthcare, e-commerce. We generate real code that fits, with bugs baked in.',
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

const TESTIMONIALS = [
  {
    quote:
      '"Bombed the review round at a staff loop. Did ~40 of these over two weeks and walked back in like I owned the codebase. Signed last Friday. 🎉"',
    initials: 'JK',
    fill: 'bg-brand text-white',
    name: 'Jordan K.',
    role: 'Staff Eng → Series B fintech',
  },
  {
    quote:
      '"Caught a race condition in my third session that I would absolutely have merged a month ago. This rewires how you read code."',
    initials: 'AM',
    fill: 'bg-coral text-white',
    name: 'Aïsha M.',
    role: 'Backend Engineer',
  },
  {
    quote:
      '"Finally something that isn\'t LeetCode. Reading real, ugly code under pressure is the skill nobody trains. This trains it."',
    initials: 'SR',
    fill: 'bg-accent-blue text-white',
    name: 'Sam R.',
    role: 'SWE II @ big tech',
  },
  {
    quote:
      '"I run a bootcamp and made this required prep. My students\' review-round pass rate went from ~40% to over 80%. Wild."',
    initials: 'PL',
    fill: 'bg-[#a78bfa] text-white',
    name: 'Priya L.',
    role: 'Bootcamp lead',
  },
  {
    quote:
      '"The severity weighting retrained my instincts. I stopped nitpicking variable names and started hunting for the stuff that pages you at 3am."',
    initials: 'DV',
    fill: 'bg-hi',
    name: 'Dimitri V.',
    role: 'Senior Platform Eng',
  },
  {
    quote:
      '"One-time payment, no subscription nonsense, and I actually got better. Easiest money I\'ve spent on my career this year."',
    initials: 'TS',
    fill: 'bg-coral text-white',
    name: 'Tomás S.',
    role: 'Full-stack dev',
  },
]

// Real Stripe packs — keep in sync with /api/stripe/checkout
const PACKS = [
  {
    name: 'Starter',
    now: '$5',
    was: '$10',
    credits: '10 credits',
    popular: false,
    features: ['10 full review sessions', 'All languages & domains', 'Heatmap + skill tracking', 'Credits never expire'],
    cta: 'Get Starter',
  },
  {
    name: 'Standard',
    now: '$18',
    was: '$36',
    credits: '50 credits',
    popular: true,
    features: ['50 full review sessions', 'Everything in Starter', 'Rank ladder to 1 dan', 'Best price-per-review'],
    cta: 'Get Standard →',
  },
  {
    name: 'Pro',
    now: '$45',
    was: '$90',
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
    a: 'TypeScript and C# today, across domains like fintech, healthcare, e-commerce and realtime systems. More languages are rolling out.',
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

function Countdown() {
  const [secs, setSecs] = useState(72 * 3600)
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 72 * 3600)), 1000)
    return () => clearInterval(id)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return <span className="font-mono">{h}:{m}:{s}</span>
}

function Logo({ light = false, responsive = false }: { light?: boolean; responsive?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-display font-extrabold text-lg ${light ? 'text-white' : 'text-ink'}`}>
      <span className="w-[34px] h-[34px] border-2.5 border-ink rounded-[9px] bg-brand text-white grid place-items-center text-lg shadow-hard-sm">
        ⚔️
      </span>
      {/* Drop the wordmark on phones so the auth actions always fit. */}
      <span className={responsive ? 'hidden sm:inline' : ''}>Code Review Wars</span>
    </Link>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">{children}</div>
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

export default function LandingPage() {
  return (
    <div className="bg-cream text-ink">
      {/* ── Top banner ── */}
      <div className="bg-ink text-white text-center text-[13.5px] font-semibold py-[9px] px-4 font-display">
        🎉 Launch week — <b className="text-hi">50% OFF</b> every credit pack. Ends in <Countdown />
      </div>

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-50 bg-cream border-b-2.5 border-ink">
        <div className={`${WRAP} flex items-center gap-4 h-16`}>
          <Logo responsive />
          <div className="flex gap-1 ml-2.5 max-[900px]:hidden">
            {[
              ['#how', 'How it works'],
              ['#features', 'Features'],
              ['#love', 'Reviews'],
              ['#pricing', 'Pricing'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
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

      {/* ── Hero ── */}
      <header className="pt-16 pb-[70px]">
        <div className={`${WRAP} grid grid-cols-[1.05fr_0.95fr] max-[900px]:grid-cols-1 gap-12 items-center`}>
          <div>
            <div className="tag-pop mb-[22px]">🏆 #1 way to prep for the code review round</div>
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
              <a href="#how" className="btn-pop btn-pop-lg">
                See how it works
              </a>
            </div>
            <p className="text-[13.5px] text-ink-2 font-medium mt-3.5">
              ✅ 3 free reviews &nbsp;•&nbsp; no credit card &nbsp;•&nbsp; one-time pricing, no subscription
            </p>
            <div className="flex items-center gap-3.5 mt-[26px] flex-wrap">
              <div className="flex">
                {[
                  ['JK', 'bg-hi'],
                  ['AM', 'bg-coral text-white'],
                  ['SR', 'bg-accent-blue text-white'],
                  ['PL', 'bg-brand text-white'],
                  ['DV', 'bg-[#a78bfa] text-white'],
                ].map(([initials, fill], i) => (
                  <span key={initials} className={`av-pop ${fill} ${i > 0 ? '-ml-3' : ''}`}>
                    {initials}
                  </span>
                ))}
              </div>
              <div>
                <div className="text-[#f59e0b] tracking-wider">★★★★★</div>
                <div className="text-[13.5px] font-semibold text-ink-2">
                  Loved by engineers prepping for <b className="text-ink">FAANG</b>
                </div>
              </div>
            </div>
          </div>

          <HeroMock />
        </div>
      </header>

      {/* ── Proof bar ── */}
      <div className="bg-cream-2 border-y-2.5 border-ink py-6">
        <div className={`${WRAP} flex items-center justify-center gap-[38px] flex-wrap font-display font-bold text-[15px] text-ink-2`}>
          <div><span className="text-[26px] text-ink">2 languages</span> · 7 domains</div>
          <div className="hidden sm:block">•</div>
          <div><span className="text-[26px] text-ink">4–6</span> bugs per challenge</div>
          <div className="hidden sm:block">•</div>
          <div><span className="text-[26px] text-ink">9 ranks</span> to climb</div>
          <div className="hidden sm:block">•</div>
          <div><span className="text-[26px] text-ink">3 free</span> sessions to start</div>
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

      {/* ── Testimonials ── */}
      <section id="love" className="py-[84px]">
        <div className={`${WRAP} text-center`}>
          <Eyebrow>don&apos;t take our word for it</Eyebrow>
          <SectionHeading>
            Engineers are <span className="mark-hi">shipping their offers</span>
          </SectionHeading>
          <div className="columns-3 max-[900px]:columns-1 gap-[18px] mt-12 text-left">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="break-inside-avoid mb-[18px] p-[22px] bg-paper border-2.5 border-ink rounded-pop-lg shadow-hard">
                <span className="block text-[#f59e0b] tracking-wider mb-[11px]">★★★★★</span>
                <p className="text-[14.5px] leading-[1.6] mb-4">{t.quote}</p>
                <div className="flex items-center gap-[11px]">
                  <span className={`av-pop ${t.fill}`}>{t.initials}</span>
                  <div>
                    <div className="font-display font-bold text-sm">{t.name}</div>
                    <div className="text-[12.5px] text-ink-3">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className="font-display font-extrabold text-[46px]">{p.now}</span>
                  <span className="text-xl text-ink-3 line-through font-bold">{p.was}</span>
                </div>
                <div className="font-bold text-brand text-[15px]">{p.credits}</div>
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
            ✅ Start with 3 free sessions — no card required.
          </div>
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

      {/* ── Founder note ── */}
      <section className="bg-paper border-t-2.5 border-ink py-[84px]">
        <div className={WRAP}>
          <div className="max-w-[780px] mx-auto p-9 bg-cream border-2.5 border-ink rounded-pop-xl shadow-hard-lg">
            <div className="flex items-center gap-3.5 mb-2">
              <span className="av-pop !w-[54px] !h-[54px] !text-lg bg-brand text-white">CW</span>
              <div>
                <div className="font-display font-extrabold text-lg">A note from the founder 👋</div>
                <div className="text-[13px] text-ink-3">Built solo, shipped fast</div>
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
            <div className="font-display font-extrabold text-[22px] mt-3.5">— the maker of Code Review Wars</div>
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
            Walk in having reviewed a hundred bugs. Start free — three reviews on the house, no card.
          </p>
          <div className="mt-8 flex gap-3.5 justify-center flex-wrap">
            <Link href="/signup" className="btn-pop btn-pop-yellow btn-pop-lg">
              ⚡ Start catching bugs — free
            </Link>
          </div>
          <p className="mt-4 text-[#eafff0] font-semibold text-sm">
            ★★★★★ &nbsp;Join the engineers getting dangerous in review
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ink text-[#d6d3d1] py-12 pb-9">
        <div className={`${WRAP} flex items-center justify-between gap-5 flex-wrap`}>
          <Logo light />
          <div className="flex gap-[22px] text-sm">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <div className="text-[13px] text-[#a8a29e]">© 2026 · Built for devs who catch things.</div>
        </div>
      </footer>
    </div>
  )
}
