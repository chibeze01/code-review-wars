import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import { createPortal } from 'react-dom'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, lineNumbers } from '@codemirror/view'
import type { EditorView as EditorViewType } from '@codemirror/view'
import {
  InlineWidget,
  decorationField,
  setDecorationsEffect,
  buildDecorations,
  COMMENT_COLORS,
} from '../lib/inlineCommentExtension'
import type { Language, CodeComment } from '../types'

// ── Internal state types ────────────────────────────────────────────────────

interface InternalComment extends CodeComment {
  widget: InlineWidget
  collapsed: boolean
}

interface PendingForm {
  startLine: number
  endLine: number
  selectedText: string
  widget: InlineWidget
}

// ── Inline Comment Card (GitHub-style) ─────────────────────────────────────

function InlineCommentCard({
  comment,
  readOnly,
  onDelete,
  onToggleCollapse,
}: {
  comment: InternalComment
  readOnly: boolean
  onDelete: () => void
  onToggleCollapse: () => void
}) {
  const col = COMMENT_COLORS[comment.colorIndex % COMMENT_COLORS.length]

  const lineLabel =
    comment.startLine === comment.endLine
      ? `Line ${comment.startLine}`
      : `Lines ${comment.startLine}–${comment.endLine}`

  if (comment.collapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer select-none group"
        style={{
          backgroundColor: col.bg,
          borderLeft: `3px solid ${col.bar}`,
          borderTop: `1px solid ${col.bar}22`,
        }}
      >
        {/* Expand chevron */}
        <svg
          className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
          style={{ color: col.text }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span
          className="text-xs font-mono font-semibold shrink-0"
          style={{ color: col.text }}
        >
          {lineLabel}
        </span>

        <span className="text-xs text-slate-500 truncate flex-1 italic">
          {comment.comment}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: col.bg,
        borderLeft: `3px solid ${col.bar}`,
        borderTop: `1px solid ${col.bar}22`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 group hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100"
            style={{ color: col.text }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-xs font-mono font-semibold" style={{ color: col.text }}>
            {lineLabel}
          </span>
        </button>

        {!readOnly && (
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 text-xs px-1 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected code excerpt */}
      {comment.selectedText.trim() && (
        <div className="mx-4 mb-2">
          <code
            className="block text-xs text-slate-500 bg-black/25 rounded px-2.5 py-1.5 leading-relaxed font-mono line-clamp-3"
          >
            {comment.selectedText.trim().slice(0, 200)}
          </code>
        </div>
      )}

      {/* Comment body */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed" style={{ color: col.text }}>
          {comment.comment}
        </p>
      </div>
    </div>
  )
}

// ── Inline Comment Form ─────────────────────────────────────────────────────

function InlineCommentForm({
  startLine,
  endLine,
  selectedText,
  onSave,
  onCancel,
}: {
  startLine: number
  endLine: number
  selectedText: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Small delay so CM6 finishes its layout pass before we steal focus
    const id = setTimeout(() => ref.current?.focus(), 60)
    return () => clearTimeout(id)
  }, [])

  const lineLabel =
    startLine === endLine ? `Line ${startLine}` : `Lines ${startLine}–${endLine}`

  return (
    <div className="bg-[#1c2128] border-y border-violet-500/30">
      {/* Form header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-violet-400 font-mono">{lineLabel}</span>
        <button
          onClick={onCancel}
          className="text-slate-600 hover:text-slate-300 text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Selected code preview */}
      {selectedText.trim() && (
        <div className="mx-4 mb-2">
          <code className="block text-xs text-slate-500 bg-black/30 rounded px-2.5 py-1.5 leading-relaxed font-mono line-clamp-2">
            {selectedText.trim().slice(0, 160)}
          </code>
        </div>
      )}

      <div className="px-4 pb-3 flex flex-col gap-2">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
              e.preventDefault()
              onSave(text.trim())
            }
          }}
          placeholder="What's the issue here? (⌘+Enter to save)"
          rows={3}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => text.trim() && onSave(text.trim())}
            disabled={!text.trim()}
            className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
          >
            Save comment
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-400 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Editor theme ────────────────────────────────────────────────────────────

const editorTheme = EditorView.theme({
  '&.cm-editor': { backgroundColor: 'transparent' },
  '.cm-gutters': {
    backgroundColor: '#161b22',
    borderRight: '1px solid #30363d',
    color: '#484f58',
    userSelect: 'none',
  },
  // Highlight line number on hover to hint it's clickable
  '.cm-gutter.cm-lineNumbers .cm-gutterElement:hover': {
    color: '#a78bfa',
    cursor: 'pointer',
  },
  '.cm-gutter.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '12px',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.02)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(139, 92, 246, 0.28) !important',
  },
  '.cm-cursor': { borderLeftColor: '#c4b5fd' },
})

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  code: string
  language: Language
  readOnly?: boolean
  /** Called whenever the comment list changes — gives the parent plain CodeComment[] */
  onCommentsChange?: (comments: CodeComment[]) => void
  /** Pre-populate with past comments (feedback view) */
  initialComments?: CodeComment[]
}

export function AnnotatedCodeEditor({
  code,
  language,
  readOnly = false,
  onCommentsChange,
  initialComments = [],
}: Props) {
  const viewRef = useRef<EditorViewType | null>(null)

  // ── Internal comment state (includes widget refs) ─────────────────────
  const [comments, setComments] = useState<InternalComment[]>(() =>
    initialComments.map((c) => ({
      ...c,
      widget: new InlineWidget(c.id),
      collapsed: false,
    })),
  )

  const [pendingForm, setPendingForm] = useState<PendingForm | null>(null)

  // Track current selection (via updateListener) so gutter click can use it
  const selectionRef = useRef<{ start: number; end: number; text: string } | null>(null)

  // ── Tell parent about plain comment list whenever it changes ──────────
  useEffect(() => {
    onCommentsChange?.(
      comments.map(({ widget: _w, collapsed: _c, ...rest }) => rest),
    )
  }, [comments, onCommentsChange])

  // ── Recompute CM6 decorations whenever React state changes ────────────
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const decos = buildDecorations(
      comments.map((c) => ({
        startLine: c.startLine,
        endLine: c.endLine,
        colorIndex: c.colorIndex,
        widget: c.widget,
      })),
      pendingForm
        ? {
            startLine: pendingForm.startLine,
            endLine: pendingForm.endLine,
            widget: pendingForm.widget,
          }
        : null,
      view.state.doc,
    )
    view.dispatch({ effects: setDecorationsEffect.of(decos) })
    // Ask CM6 to re-measure block widget heights (needed after collapse/expand)
    requestAnimationFrame(() => view.requestMeasure())
  }, [comments, pendingForm])

  // ── Gutter click → open/close form ───────────────────────────────────
  // Stored in a ref so the lineNumbersExt (created once) always has a fresh copy.
  const openFormRef = useRef<(clickedLine: number) => void>(() => {})
  openFormRef.current = (clickedLine: number) => {
    if (readOnly) return
    // Clicking the same line as an open form → close it
    if (pendingForm?.endLine === clickedLine) {
      setPendingForm(null)
      return
    }
    // If text is selected in the editor, use its line range; else single line
    const sel = selectionRef.current
    const startLine = sel ? sel.start : clickedLine
    const endLine   = sel ? sel.end   : clickedLine
    const selectedText = sel ? sel.text : ''
    setPendingForm({
      startLine,
      endLine,
      selectedText,
      widget: new InlineWidget(`form-${Date.now()}`),
    })
  }

  // ── Line-number gutter with click-to-annotate ────────────────────────
  // Uses the proper CM6 lineNumbers({ domEventHandlers }) API — this
  // receives a BlockInfo (the exact line block) rather than raw coordinates,
  // so it works reliably for every click on a line number.
  const lineNumbersExt = useMemo(
    () =>
      lineNumbers({
        domEventHandlers: {
          mousedown(view, line) {
            if (readOnly) return false
            const lineNum = view.state.doc.lineAt(line.from).number
            // Defer so CM6 finishes handling its own mousedown first
            setTimeout(() => openFormRef.current(lineNum), 0)
            return true  // tell CM6 we handled it (prevents cursor repositioning)
          },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly],
  )

  // ── Selection listener ─────────────────────────────────────────────────
  const selectionExt = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet) return
        const sel = update.state.selection.main
        if (sel.empty) { selectionRef.current = null; return }
        const from = Math.min(sel.from, sel.to)
        const to   = Math.max(sel.from, sel.to)
        const startLine = update.state.doc.lineAt(from).number
        let endLine   = update.state.doc.lineAt(to).number
        // If selection ends exactly at start of a line (trailing newline), back off
        if (to > from && update.state.doc.lineAt(to).from === to) {
          endLine = Math.max(startLine, endLine - 1)
        }
        selectionRef.current = {
          start: startLine,
          end: endLine,
          text: update.state.sliceDoc(from, Math.min(to, from + 400)),
        }
      }),
    [],
  )

  // ── Language extension ─────────────────────────────────────────────────
  const langExt = useMemo(
    () => (language === 'TypeScript' ? javascript({ typescript: true }) : java()),
    [language],
  )

  const extensions = useMemo(
    () => [langExt, decorationField, lineNumbersExt, selectionExt, editorTheme],
    [langExt, lineNumbersExt, selectionExt],
  )

  // ── Comment operations ─────────────────────────────────────────────────
  function saveComment(text: string) {
    if (!pendingForm) return
    const id = crypto.randomUUID()
    const colorIndex = comments.length % COMMENT_COLORS.length
    setComments((prev) => [
      ...prev,
      {
        id,
        startLine: pendingForm.startLine,
        endLine: pendingForm.endLine,
        selectedText: pendingForm.selectedText,
        comment: text,
        colorIndex,
        widget: new InlineWidget(id),
        collapsed: false,
      },
    ])
    setPendingForm(null)
  }

  function deleteComment(id: string) {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== id)
      // Re-index colours so they stay contiguous
      return next.map((c, i) => ({ ...c, colorIndex: i % COMMENT_COLORS.length }))
    })
  }

  function toggleCollapse(id: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed } : c)),
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const lineCount = code.split('\n').length

  return (
    <div className="relative flex flex-col">
      {/* Mac-style title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border border-b-0 border-[#30363d] rounded-t-lg">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-xs text-slate-600 font-mono">
          {language} · {lineCount} lines
        </span>
        {!readOnly ? (
          <span className="text-xs text-slate-600">
            {comments.length > 0
              ? `${comments.length} annotation${comments.length !== 1 ? 's' : ''} · click line № to add`
              : 'Click a line number to annotate'}
          </span>
        ) : (
          <span className="text-xs text-violet-400">
            {comments.length > 0
              ? `${comments.length} annotation${comments.length !== 1 ? 's' : ''}`
              : 'No annotations'}
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="border border-[#30363d] rounded-b-lg overflow-hidden">
        <CodeMirror
          value={code}
          extensions={extensions}
          theme={oneDark}
          editable={false}
          onCreateEditor={(view) => {
            viewRef.current = view
            // Apply initial decorations immediately (avoids flash in feedback view)
            if (initialComments.length > 0) {
              const decos = buildDecorations(
                comments.map((c) => ({
                  startLine: c.startLine,
                  endLine: c.endLine,
                  colorIndex: c.colorIndex,
                  widget: c.widget,
                })),
                null,
                view.state.doc,
              )
              view.dispatch({ effects: setDecorationsEffect.of(decos) })
            }
          }}
          basicSetup={{
            lineNumbers: false,       // we provide our own via lineNumbersExt
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            searchKeymap: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>

      {/* ── React portals → render into CM6 block widget DOM nodes ────── */}
      {comments.map((c) =>
        createPortal(
          <InlineCommentCard
            comment={c}
            readOnly={readOnly}
            onDelete={() => deleteComment(c.id)}
            onToggleCollapse={() => toggleCollapse(c.id)}
          />,
          c.widget.dom,
        ),
      )}

      {pendingForm &&
        createPortal(
          <InlineCommentForm
            startLine={pendingForm.startLine}
            endLine={pendingForm.endLine}
            selectedText={pendingForm.selectedText}
            onSave={saveComment}
            onCancel={() => setPendingForm(null)}
          />,
          pendingForm.widget.dom,
        )}
    </div>
  )
}
