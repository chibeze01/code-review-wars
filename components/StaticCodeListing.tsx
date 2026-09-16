import { Fragment } from 'react'
import { highlightTypeScript } from '@/lib/highlight'
import { COMMENT_COLORS } from '@/lib/commentExtension'
import type { CodeComment, Language } from '@/types'

interface Props {
  code: string
  language: Language
  comments: CodeComment[]
}

// Server-rendered, crawlable twin of the live AnnotatedCodeEditor in read-only
// mode: same window chrome, gutter, highlight palette and inline comment cards.
export function StaticCodeListing({ code, language, comments }: Props) {
  const lines = highlightTypeScript(code)

  const lineBg = new Map<number, string>()
  const cardsAfter = new Map<number, CodeComment[]>()
  for (const c of comments) {
    const col = COMMENT_COLORS[c.colorIndex % COMMENT_COLORS.length]
    for (let l = c.startLine; l <= c.endLine; l++) if (!lineBg.has(l)) lineBg.set(l, col.bg)
    cardsAfter.set(c.endLine, [...(cardsAfter.get(c.endLine) ?? []), c])
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-cream-2 border-2.5 border-b-0 border-ink rounded-t-pop">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-coral" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-hi" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-brand" />
        </div>
        <span className="text-xs text-ink-2 font-mono font-bold">{language} · {lines.length} lines</span>
        <span className="text-xs text-brand font-bold">
          {comments.length} annotation{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="border-2.5 border-ink rounded-b-pop shadow-hard bg-paper overflow-x-auto">
        <div className="font-mono text-[13px] leading-[1.75] py-1.5">
          {lines.map((tokens, i) => {
            const n = i + 1
            return (
              <Fragment key={n}>
                <div className="flex" style={{ backgroundColor: lineBg.get(n) }}>
                  <span className="sticky left-0 z-10 w-[52px] shrink-0 text-right pr-2 pl-3 bg-cream-2 border-r-2 border-ink text-ink-3 select-none">
                    {n}
                  </span>
                  <span className="pl-3 pr-5 whitespace-pre">
                    {tokens.map((t, j) => (
                      <span key={j} className={t.className ?? undefined}>{t.text}</span>
                    ))}
                  </span>
                </div>
                {cardsAfter.get(n)?.map((c) => <InlineNote key={c.id} comment={c} />)}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InlineNote({ comment }: { comment: CodeComment }) {
  const col = COMMENT_COLORS[comment.colorIndex % COMMENT_COLORS.length]
  const label = comment.startLine === comment.endLine
    ? `Line ${comment.startLine}`
    : `Lines ${comment.startLine}–${comment.endLine}`
  return (
    <div
      className="sticky left-0 w-full font-sans"
      style={{ backgroundColor: col.bg, borderLeft: `3px solid ${col.border}`, borderTop: `1px solid ${col.border}22` }}
    >
      <div className="px-4 pt-2 pb-1 text-xs font-mono font-semibold" style={{ color: col.text }}>
        {label}
      </div>
      {comment.selectedText.trim() && (
        <div className="mx-4 mb-2">
          <code className="block text-xs text-ink-2 bg-ink/5 rounded px-2.5 py-1.5 leading-relaxed font-mono line-clamp-3 whitespace-pre-wrap">
            {comment.selectedText.trim().slice(0, 200)}
          </code>
        </div>
      )}
      <p className="px-4 pb-3 text-sm leading-relaxed whitespace-normal" style={{ color: col.text }}>
        {comment.comment}
      </p>
    </div>
  )
}
