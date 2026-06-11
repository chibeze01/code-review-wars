import Link from 'next/link'

const PACKS = [
  { name: 'Starter',  credits: 10,  price: '$5',  per: '$0.50 / review', highlight: false },
  { name: 'Standard', credits: 50,  price: '$18', per: '$0.36 / review', highlight: true  },
  { name: 'Pro',      credits: 150, price: '$45', per: '$0.30 / review', highlight: false },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200">
      <nav className="border-b border-[#21262d] bg-[#161b22] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            CR
          </div>
          <span className="text-base font-bold text-slate-100">Code Review Wars</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
          <Link
            href="/signup"
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-100 mb-4">Simple credit pricing</h1>
        <p className="text-slate-400 mb-2">1 credit = 1 full practice session (code generation + AI evaluation)</p>
        <p className="text-sm text-violet-400 font-semibold mb-12">
          Every new account gets 5 free credits — no credit card required
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PACKS.map(({ name, credits, price, per, highlight }) => (
            <div
              key={name}
              className={`relative bg-[#161b22] border rounded-2xl p-8 flex flex-col gap-4 text-left ${
                highlight ? 'border-violet-500' : 'border-[#30363d]'
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-violet-600 text-white px-4 py-1 rounded-full whitespace-nowrap">
                  Best value
                </span>
              )}
              <p className="text-sm font-semibold text-slate-400">{name}</p>
              <div>
                <p className="text-4xl font-bold text-slate-100">{credits}</p>
                <p className="text-sm text-slate-500">credits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-200">{price}</p>
                <p className="text-xs text-slate-600">{per}</p>
              </div>
              <Link
                href="/signup"
                className={`mt-2 py-3 rounded-xl text-sm font-semibold transition-colors text-center ${
                  highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-slate-300 border border-[#30363d]'
                }`}
              >
                Get started →
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-left">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">What's included in every session</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              '60–120 line production-style code snippet',
              '4–6 hidden bugs, security issues, and performance problems',
              'Inline annotation editor (click any line)',
              'AI evaluation with score A–F and 0–100 points',
              'Issues found / missed breakdown',
              'Coaching feedback + ideal expert review',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-emerald-500 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
