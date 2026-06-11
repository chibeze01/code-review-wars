'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { RANKS } from '@/lib/ranks'
import { RankBadge } from '@/components/RankBadge'

const VOLT = '#ccff00'
const RED = '#cf0a2c'

// Interactive hero demo — three hidden bugs, 34 honor each (3 × 34 = 102 → crosses
// the real 100-honor threshold for 7 kyu, same ladder the app uses)
const HONOR_PER_BUG = 34
const DEMO_BUGS: Record<number, string> = {
  3: 'SQL injection — user input is interpolated straight into the query. Use a $1 placeholder.',
  5: 'rows[0] can be undefined — this crashes on an invalid code. Guard before dereferencing.',
  7: 'Hardcoded secret fallback — tokens become forgeable the moment the env var is missing.',
}

const MARQUEE_ITEMS = ['FIND THE BUG', 'EARN HONOR', 'RANK UP', 'REPEAT']

export default function LandingPage() {
  const tiltRef = useRef<HTMLDivElement>(null)
  const [found, setFound] = useState<number[]>([])
  const honor = found.length * HONOR_PER_BUG
  const promoted = found.length === Object.keys(DEMO_BUGS).length

  // Scroll-driven 3D perspective tilt: starts pitched back, flattens as it scrolls in
  useEffect(() => {
    const el = tiltRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)))
      el.style.setProperty('--rx', `${(1 - p) * 24 + 2}deg`)
      el.style.setProperty('--lift', `${(1 - p) * 30}px`)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Scroll-reveal animations
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Mouse-tracking tilt layered on top of the scroll tilt
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${x * 8}deg`)
    el.style.setProperty('--rx2', `${-y * 5}deg`)
  }
  function handlePointerLeave() {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx2', '0deg')
  }

  function toggleBug(line: number) {
    setFound((f) => (f.includes(line) ? f : [...f, line]))
  }

  const sqlLine = "`SELECT * FROM coupons WHERE code = '${code}'`"

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f3] overflow-x-hidden">
      <style>{`
        @keyframes cw-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes cw-float { 0%,100% { transform: translateY(0) rotate(45deg) } 50% { transform: translateY(-14px) rotate(45deg) } }
        @keyframes cw-float2 { 0%,100% { transform: translateY(0) } 50% { transform: translateY(10px) } }
        @keyframes cw-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
        @keyframes cw-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        .cw-marquee-track { animation: cw-marquee 22s linear infinite; }
        .cw-marquee-track.rev { animation-direction: reverse; }
        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
        [data-reveal].in { opacity: 1; transform: translateY(0); }
        .cw-tilt {
          transform: perspective(1400px)
            rotateX(calc(var(--rx, 14deg) + var(--rx2, 0deg)))
            rotateY(var(--ry, 0deg))
            translateY(var(--lift, 0px));
          transition: transform .15s ease-out;
          transform-style: preserve-3d;
        }
        .cw-pop { animation: cw-pop .45s cubic-bezier(.2,.7,.2,1) both; }
        .cw-grid-bg {
          background-image:
            linear-gradient(rgba(245,245,243,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,245,243,.045) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        @media (prefers-reduced-motion: reduce) {
          .cw-marquee-track { animation: none; }
          [data-reveal] { opacity: 1; transform: none; transition: none; }
          .cw-tilt { transform: none !important; }
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ccff00] flex items-center justify-center text-black font-black text-sm -skew-x-6">
            CR
          </div>
          <span className="text-base font-black tracking-tight uppercase italic">
            Code Review <span className="text-[#ccff00]">Wars</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[#ccff00] hover:bg-[#b9eb00] text-black px-5 py-2.5 font-black uppercase italic tracking-tight -skew-x-6 transition-all hover:-translate-y-0.5"
          >
            <span className="inline-block skew-x-6">Start free</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative cw-grid-bg">
        {/* glow + watermark */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(700px 380px at 70% 0%, ${VOLT}14, transparent 70%), radial-gradient(520px 300px at 12% 32%, ${RED}1f, transparent 70%)` }}
        />
        <span className="pointer-events-none select-none absolute right-2 top-24 text-[11rem] leading-none font-black text-transparent opacity-[.06] hidden xl:block" style={{ WebkitTextStroke: `2px ${VOLT}` }}>
          道場
        </span>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-10">
          <div className="flex items-center gap-3 mb-8" data-reveal>
            <span className="h-px w-10 bg-[#ccff00]" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ccff00]">
              The code review dojo
            </span>
          </div>

          <h1 className="font-black italic uppercase leading-[0.92] tracking-tighter text-6xl md:text-8xl mb-8" data-reveal>
            Find the bugs.
            <br />
            <span className="text-[#ccff00]">Earn the rank.</span>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16" data-reveal style={{ transitionDelay: '.1s' }}>
            <p className="text-lg text-neutral-400 max-w-md leading-relaxed">
              AI-generated production code, seeded with real bugs. Annotate like it&apos;s a PR,
              get graded by an AI sensei, and climb from{' '}
              <span className="text-neutral-200 font-semibold">8 kyu</span> to{' '}
              <span style={{ color: RED }} className="font-semibold">Review Sensei</span>.
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/signup"
                className="bg-[#ccff00] hover:bg-[#b9eb00] text-black px-8 py-4 font-black uppercase italic tracking-tight -skew-x-6 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-8px_#ccff00aa]"
              >
                <span className="inline-block skew-x-6">Start training →</span>
              </Link>
              <span className="text-xs text-neutral-500 leading-tight">
                5 free credits.
                <br />
                No card required.
              </span>
            </div>
          </div>
        </div>

        {/* ── 3D-tilt interactive demo ── */}
        <div className="relative max-w-5xl mx-auto px-6 pb-24" style={{ perspective: '1400px' }}>
          {/* floating shapes */}
          <span className="pointer-events-none absolute -left-2 top-10 w-5 h-5 bg-[#ccff00] hidden lg:block" style={{ animation: 'cw-float 5s ease-in-out infinite' }} />
          <span className="pointer-events-none absolute -right-3 bottom-24 w-8 h-8 border-2 hidden lg:block" style={{ borderColor: RED, animation: 'cw-float2 6s ease-in-out infinite' }} />

          <div
            ref={tiltRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="cw-tilt"
          >
            <div className="p-[1px] rounded-2xl" style={{ background: `linear-gradient(135deg, ${VOLT}66, transparent 35%, transparent 65%, ${RED}66)` }}>
              <div className="rounded-2xl bg-[#101010] shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] overflow-hidden">
                {/* window chrome */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#161616]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-xs text-neutral-500 font-mono">coupon-service.ts · review in progress</span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 hidden sm:block">
                    {promoted ? <span className="text-[#ccff00]">all bugs found</span> : `${found.length}/3 bugs found — click the code`}
                  </span>
                </div>

                <div className="grid md:grid-cols-[1fr_240px]">
                  {/* code panel */}
                  <div className="font-mono text-[13px] leading-7 p-5 overflow-x-auto">
                    {/* line 1 */}
                    <div className="flex gap-4"><span className="text-neutral-700 select-none w-4 text-right">1</span><span><span className="text-[#ff7b72]">async function</span> <span className="text-[#d2a8ff]">applyCoupon</span><span className="text-neutral-300">(code: </span><span className="text-[#79c0ff]">string</span><span className="text-neutral-300">) {'{'}</span></span></div>
                    {/* line 2 */}
                    <div className="flex gap-4"><span className="text-neutral-700 select-none w-4 text-right">2</span><span className="text-neutral-300">  <span className="text-[#ff7b72]">const</span> result = <span className="text-[#ff7b72]">await</span> db.<span className="text-[#d2a8ff]">query</span>(</span></div>
                    {/* line 3 — bug */}
                    <button
                      type="button"
                      onClick={() => toggleBug(3)}
                      className={`flex gap-4 w-full text-left transition-colors ${found.includes(3) ? 'bg-[#ccff00]/10' : 'hover:bg-white/5 cursor-pointer'}`}
                      data-demo-bug="3"
                    >
                      <span className="text-neutral-700 select-none w-4 text-right">3</span>
                      <span className={`text-[#a5d6ff] ${found.includes(3) ? '' : 'underline decoration-dotted decoration-2 underline-offset-4'}`} style={{ textDecorationColor: found.includes(3) ? undefined : `${RED}99` }}>
                        {'    '}{sqlLine}
                      </span>
                    </button>
                    {found.includes(3) && (
                      <div className="cw-pop my-1 ml-8 mr-3 border-l-2 pl-3 py-1.5 text-xs font-sans text-neutral-300 bg-[#ccff00]/5" style={{ borderColor: VOLT }}>
                        <span className="font-bold text-[#ccff00]">+{HONOR_PER_BUG} honor · </span>{DEMO_BUGS[3]}
                      </div>
                    )}
                    {/* line 4 */}
                    <div className="flex gap-4"><span className="text-neutral-700 select-none w-4 text-right">4</span><span className="text-neutral-300">  )</span></div>
                    {/* line 5 — bug */}
                    <button
                      type="button"
                      onClick={() => toggleBug(5)}
                      className={`flex gap-4 w-full text-left transition-colors ${found.includes(5) ? 'bg-[#ccff00]/10' : 'hover:bg-white/5 cursor-pointer'}`}
                      data-demo-bug="5"
                    >
                      <span className="text-neutral-700 select-none w-4 text-right">5</span>
                      <span className={`text-neutral-300 ${found.includes(5) ? '' : 'underline decoration-dotted decoration-2 underline-offset-4'}`} style={{ textDecorationColor: found.includes(5) ? undefined : `${RED}99` }}>
                        {'  '}<span className="text-[#ff7b72]">return</span> result.rows[<span className="text-[#79c0ff]">0</span>].discount
                      </span>
                    </button>
                    {found.includes(5) && (
                      <div className="cw-pop my-1 ml-8 mr-3 border-l-2 pl-3 py-1.5 text-xs font-sans text-neutral-300 bg-[#ccff00]/5" style={{ borderColor: VOLT }}>
                        <span className="font-bold text-[#ccff00]">+{HONOR_PER_BUG} honor · </span>{DEMO_BUGS[5]}
                      </div>
                    )}
                    {/* line 6 */}
                    <div className="flex gap-4"><span className="text-neutral-700 select-none w-4 text-right">6</span><span className="text-neutral-300">{'}'}</span></div>
                    {/* line 7 — bug */}
                    <button
                      type="button"
                      onClick={() => toggleBug(7)}
                      className={`flex gap-4 w-full text-left transition-colors ${found.includes(7) ? 'bg-[#ccff00]/10' : 'hover:bg-white/5 cursor-pointer'}`}
                      data-demo-bug="7"
                    >
                      <span className="text-neutral-700 select-none w-4 text-right">7</span>
                      <span className={`${found.includes(7) ? '' : 'underline decoration-dotted decoration-2 underline-offset-4'}`} style={{ textDecorationColor: found.includes(7) ? undefined : `${RED}99` }}>
                        <span className="text-[#ff7b72]">const</span> <span className="text-neutral-300">SECRET = process.env.JWT_SECRET ?? </span><span className="text-[#a5d6ff]">&apos;dev123&apos;</span>
                      </span>
                    </button>
                    {found.includes(7) && (
                      <div className="cw-pop my-1 ml-8 mr-3 border-l-2 pl-3 py-1.5 text-xs font-sans text-neutral-300 bg-[#ccff00]/5" style={{ borderColor: VOLT }}>
                        <span className="font-bold text-[#ccff00]">+{HONOR_PER_BUG} honor · </span>{DEMO_BUGS[7]}
                      </div>
                    )}
                    <div className="flex gap-4"><span className="text-neutral-700 select-none w-4 text-right">8</span><span className="text-neutral-500"><span style={{ animation: 'cw-blink 1.1s step-end infinite' }}>▍</span></span></div>
                  </div>

                  {/* score panel */}
                  <div className="border-t md:border-t-0 md:border-l border-white/10 bg-[#0d0d0d] p-5 flex flex-col gap-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Your rank</p>
                    <div className={promoted ? 'cw-pop' : ''}>
                      <RankBadge rank={promoted ? RANKS[1] : RANKS[0]} size="lg" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-neutral-500">honor</span>
                        <span className="font-bold text-[#ccff00]">{honor}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 overflow-hidden">
                        <div className="h-full transition-all duration-700" style={{ width: `${Math.min(100, honor)}%`, background: VOLT }} />
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-1.5">
                        {promoted ? 'Promoted — 7 kyu unlocked' : `${100 - honor} honor to 7 kyu`}
                      </p>
                    </div>
                    {promoted ? (
                      <Link href="/signup" className="cw-pop mt-auto text-center text-xs font-black uppercase italic bg-[#ccff00] text-black px-3 py-2.5 -skew-x-6 hover:bg-[#b9eb00] transition-colors">
                        <span className="inline-block skew-x-6">Keep climbing →</span>
                      </Link>
                    ) : (
                      <p className="mt-auto text-[11px] text-neutral-600 leading-relaxed">
                        This is the real game: 3 bugs are hiding in the code.{' '}
                        <span className="text-neutral-400">Click the suspicious lines.</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────── */}
      <div className="bg-[#ccff00] py-3 -rotate-1 scale-105 overflow-hidden">
        <div className="cw-marquee-track flex whitespace-nowrap">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
              {[...Array(3)].map((_, rep) => (
                <span key={rep} className="flex">
                  {MARQUEE_ITEMS.map((item) => (
                    <span key={item} className="text-black font-black italic uppercase tracking-tight text-xl px-6 flex items-center gap-6">
                      {item} <span className="w-2.5 h-2.5 bg-black rotate-45 inline-block" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="flex items-center gap-3 mb-14" data-reveal>
          <span className="h-px w-10" style={{ background: RED }} />
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>
            The training loop
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Generate', body: 'Pick a language and scenario. The AI writes 60–120 lines of production-style code with 4–6 bugs planted inside — security holes, race conditions, N+1 queries.' },
            { n: '02', title: 'Annotate', body: 'Click any line and call out the issue, exactly like a real PR review. Severity, impact, the fix — the sharper your annotation, the higher your score.' },
            { n: '03', title: 'Rank up', body: 'An AI sensei grades you A–F against every hidden issue. Each point of score becomes honor. Honor climbs the ladder: 8 kyu to Review Sensei.' },
          ].map((step, i) => (
            <div
              key={step.n}
              data-reveal
              style={{ transitionDelay: `${i * 0.12}s` }}
              className="group border border-white/10 bg-[#101010] p-7 hover:border-[#ccff00]/60 hover:-translate-y-1.5 transition-all duration-300"
            >
              <span className="block text-5xl font-black italic text-transparent mb-6 group-hover:text-[#ccff00] transition-colors duration-300" style={{ WebkitTextStroke: '1.5px #3a3a3a' }}>
                {step.n}
              </span>
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        {/* stat band */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 border border-white/10 divide-x divide-white/10" data-reveal>
          {[
            { k: '6', v: 'issue categories' },
            { k: '2', v: 'languages' },
            { k: '9', v: 'ranks to climb' },
            { k: '∞', v: 'generated snippets' },
          ].map((s) => (
            <div key={s.v} className="p-6 text-center max-md:border-b max-md:border-white/10">
              <p className="text-4xl font-black italic text-[#ccff00]">{s.k}</p>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mt-2">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rank ladder ─────────────────────────────────────── */}
      <section className="relative border-y border-white/10 bg-[#0d0d0d] cw-grid-bg">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14" data-reveal>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
              Climb the <span className="text-[#ccff00]">ranks</span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Every review earns honor. Mastery comes one kata at a time — from white belt
              to the red badge of a <span style={{ color: RED }} className="font-semibold">Review Sensei</span>.
            </p>
          </div>
          <div className="relative" data-reveal>
            <span className="absolute left-0 right-0 top-1/2 h-px hidden lg:block" style={{ background: `linear-gradient(90deg, ${VOLT}55, ${RED}55)` }} />
            <div className="relative flex items-center justify-center gap-3 md:gap-4 flex-wrap">
              {RANKS.map((rank) => (
                <div key={rank.label} className="group flex flex-col items-center gap-2 bg-[#0d0d0d] px-1.5 py-2 transition-transform duration-200 hover:-translate-y-1.5 hover:scale-110">
                  <RankBadge rank={rank} size="md" />
                  <span className="text-[10px] text-neutral-600 group-hover:text-neutral-300 transition-colors whitespace-nowrap">
                    {rank.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reverse marquee ─────────────────────────────────── */}
      <div className="py-3 rotate-1 scale-105 overflow-hidden" style={{ background: RED }}>
        <div className="cw-marquee-track rev flex whitespace-nowrap">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
              {[...Array(3)].map((_, rep) => (
                <span key={rep} className="flex">
                  {['SECURITY', 'PERFORMANCE', 'LOGIC', 'ERROR HANDLING', 'RACE CONDITIONS', 'N+1 QUERIES'].map((item) => (
                    <span key={item} className="text-white font-black italic uppercase tracking-tight text-xl px-6 flex items-center gap-6">
                      {item} <span className="w-2.5 h-2.5 bg-white rotate-45 inline-block" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="bg-[#ccff00] text-black px-6 py-28 text-center relative overflow-hidden">
        <span className="pointer-events-none select-none absolute -bottom-10 left-1/2 -translate-x-1/2 text-[16rem] leading-none font-black opacity-[.05] whitespace-nowrap">
          型 KATA 型
        </span>
        <div className="relative">
          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-8" data-reveal>
            Ready to
            <br />
            review?
          </h2>
          <div data-reveal style={{ transitionDelay: '.1s' }}>
            <Link
              href="/signup"
              className="inline-block bg-black text-[#ccff00] px-10 py-5 font-black uppercase italic tracking-tight -skew-x-6 transition-all hover:-translate-y-1 hover:shadow-[0_16px_50px_-12px_rgba(0,0,0,.7)]"
            >
              <span className="inline-block skew-x-6">Start free — 5 credits →</span>
            </Link>
            <p className="mt-5 text-sm font-semibold text-black/60">No credit card. Rank 8 kyu is waiting.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#ccff00] flex items-center justify-center text-black font-black text-xs -skew-x-6">
            CR
          </div>
          <span className="text-sm font-bold text-neutral-400">Code Review Wars</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-neutral-600">
          <Link href="/pricing" className="hover:text-neutral-300 transition-colors">Pricing</Link>
          <Link href="/login" className="hover:text-neutral-300 transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-neutral-300 transition-colors">Start free</Link>
        </div>
      </footer>
    </div>
  )
}
