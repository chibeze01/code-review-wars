import { GRADE_COLORS, scoreColor } from '@/lib/ranks'
import type { CodeIssue, EvaluationResult } from '@/types'

interface Props {
  result: EvaluationResult
  issues: CodeIssue[]
  honorEarned: number
}

// Static twin of the live FeedbackPanel (same sections, same styling) for
// server-rendered pages like /sample.
export function GradedReview({ result, issues, honorEarned }: Props) {
  const gradeColor = GRADE_COLORS[result.grade] ?? GRADE_COLORS['F']
  const brilliant = result.brilliantFinds ?? []

  return (
    <div className="flex flex-col gap-5">
      {/* Score header */}
      <div className="card-pop p-5 flex items-center gap-5">
        <div
          className="shrink-0 w-20 h-20 rounded-full border-2.5 border-ink bg-paper shadow-hard flex items-center justify-center font-display font-extrabold text-3xl"
          style={{ color: gradeColor }}
        >
          {result.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3">Score</span>
            <span className="text-sm font-mono font-bold flex items-center gap-2">
              <span className="inline-flex items-center font-display font-bold text-xs bg-hi border-2 border-ink rounded-full px-2.5 py-0.5 shadow-hard-sm">
                +{honorEarned} honor
              </span>
              {result.score}/100
            </span>
          </div>
          <div className="w-full h-3 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
            <div className="h-full" style={{ width: `${Math.min(result.score, 100)}%`, background: scoreColor(result.score) }} />
          </div>
          <p className="mt-3 text-sm text-ink-2">{result.summary}</p>
        </div>
      </div>

      {brilliant.length > 0 && (
        <div className="bg-hi-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-full border-2.5 border-ink bg-hi shadow-hard-sm flex items-center justify-center font-mono font-bold text-lg">
              !!
            </span>
            <div>
              <p className="font-display font-extrabold text-base">
                ✨ Brilliant find{brilliant.length !== 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-ink-2">
                Caught {brilliant.length === 1 ? 'a flaw' : 'flaws'} we never even planted — +10 bonus points each
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {brilliant.map((item, i) => (
              <li key={i} className="text-sm text-ink flex gap-2.5">
                <span className="font-mono font-bold shrink-0 mt-0.5">✨</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Found / missed two-up */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-brand-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand-dark">
            ✅ Issues Found ({result.issuesFound.length})
          </p>
          {result.issuesFound.length === 0 ? (
            <p className="text-xs text-ink-2 italic">None correctly identified.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesFound.map((item, i) => (
                <li key={i} className="text-xs text-ink flex gap-2">
                  <span className="text-brand-dark font-bold shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-coral-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-[#c2410c]">
            ❌ Issues Missed ({result.issuesMissed.length})
          </p>
          {result.issuesMissed.length === 0 ? (
            <p className="text-xs text-ink-2 italic">Caught everything! 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesMissed.map((item, i) => (
                <li key={i} className="text-xs text-ink flex gap-2">
                  <span className="text-[#c2410c] font-bold shrink-0 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.falsePositives.length > 0 && (
        <div className="bg-hi-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-[#854d0e]">
            ⚠️ False Positives ({result.falsePositives.length})
          </p>
          <ul className="flex flex-col gap-2">
            {result.falsePositives.map((item, i) => (
              <li key={i} className="text-xs text-ink flex gap-2">
                <span className="text-[#854d0e] font-bold shrink-0 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching */}
      <div className="card-pop p-4 flex flex-col gap-3">
        <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand">🎓 Coaching feedback</p>
        <div className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{result.feedback}</div>
      </div>

      {/* Model answer — open by default here: it's the point of the page */}
      <details open className="card-pop !shadow-hard-sm overflow-hidden group">
        <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
          <span>📖 Model Answer — Ideal Review</span>
          <span className="text-xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 border-t-2.5 border-ink pt-3">
          <p className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{result.idealReview}</p>
        </div>
      </details>

      {/* All planted issues */}
      <details open className="card-pop !shadow-hard-sm overflow-hidden group">
        <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
          <span>🐛 All Intentional Issues ({issues.length})</span>
          <span className="text-xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 border-t-2.5 border-ink pt-3 flex flex-col gap-2">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded-full border-2 border-ink font-display font-bold uppercase text-[10px] ${
                issue.severity === 'critical' ? 'bg-coral-soft text-[#c2410c]' :
                issue.severity === 'major'    ? 'bg-hi-soft text-[#854d0e]' :
                                               'bg-cream-2 text-ink-2'
              }`}>{issue.severity}</span>
              <div>
                <span className="text-ink-3 mr-1 font-mono">[{issue.type}]</span>
                <span className="text-ink">{issue.description}</span>
                <span className="text-ink-3 ml-1">— {issue.lineHint}</span>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
