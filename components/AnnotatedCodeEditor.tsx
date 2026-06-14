'use client'

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
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView, lineNumbers } from '@codemirror/view'
import type { EditorView as EditorViewType } from '@codemirror/view'
import {
  InlineWidget,
  decorationField,
  setDecorationsEffect,
  buildDecorations,
  COMMENT_COLORS,
} from '@/lib/inlineCommentExtension'
import type { Language, CodeComment } from '@/types'

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

function InlineCommentCard({
  comment,
  readOnly,
  onEdit,
  onDelete,
  onToggleCollapse,
}: {
  comment: InternalComment
  readOnly: boolean
  onEdit: () => void
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
        <svg
          className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
          style={{ color: col.text }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-xs font-mono font-semibold shrink-0" style={{ color: col.text }}>
          {lineLabel}
        </span>
        <span className="text-xs text-ink-3 truncate flex-1 italic">{comment.comment}</span>
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
      <div className="flex items-center justify-between px-4 py-2">
        <button
          type="button"
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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-display font-bold px-2 py-0.5 rounded-md border-2 border-ink/15 text-ink-2 hover:border-brand hover:text-brand transition-colors"
              title="Edit annotation"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] font-display font-bold px-2 py-0.5 rounded-md border-2 border-ink/15 text-ink-2 hover:border-coral hover:text-coral transition-colors"
              title="Delete annotation"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {comment.selectedText.trim() && (
        <div className="mx-4 mb-2">
          <code className="block text-xs text-ink-2 bg-ink/5 rounded px-2.5 py-1.5 leading-relaxed font-mono line-clamp-3">
            {comment.selectedText.trim().slice(0, 200)}
          </code>
        </div>
      )}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed" style={{ color: col.text }}>{comment.comment}</p>
      </div>
    </div>
  )
}

function InlineCommentForm({
  startLine,
  endLine,
  selectedText,
  initialText = '',
  saveLabel = 'Save comment',
  onSave,
  onCancel,
}: {
  startLine: number
  endLine: number
  selectedText: string
  initialText?: string
  saveLabel?: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initialText)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      ref.current?.focus()
      // place cursor at the end when editing existing text
      const len = ref.current?.value.length ?? 0
      ref.current?.setSelectionRange(len, len)
    }, 60)
    return () => clearTimeout(id)
  }, [])

  const lineLabel = startLine === endLine ? `Line ${startLine}` : `Lines ${startLine}–${endLine}`

  return (
    <div className="bg-cream border-y-2 border-brand/40">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-bold text-brand font-mono">{lineLabel}</span>
        <button type="button" onClick={onCancel} className="text-ink-3 hover:text-ink text-xs transition-colors">✕</button>
      </div>
      {selectedText.trim() && (
        <div className="mx-4 mb-2">
          <code className="block text-xs text-ink-2 bg-ink/5 rounded px-2.5 py-1.5 leading-relaxed font-mono line-clamp-2">
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
          className="w-full bg-paper border-2 border-ink/20 rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-3 focus:outline-none focus:border-brand resize-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => text.trim() && onSave(text.trim())}
            disabled={!text.trim()}
            className="px-3.5 py-1.5 rounded-lg border-2 border-ink bg-brand text-white text-xs font-display font-bold shadow-hard-sm disabled:opacity-40 hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
          >
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border-2 border-ink/25 bg-paper text-ink-2 text-xs font-display font-bold hover:border-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Light "paper window" theme — cream gutters, ink text, yellow-marker selection
const editorTheme = EditorView.theme({
  '&.cm-editor': { backgroundColor: '#ffffff', color: '#1c1917' },
  '.cm-content': { fontFamily: 'var(--font-mono), monospace', fontSize: '13px' },
  '.cm-gutters': {
    backgroundColor: '#fff2dc',
    borderRight: '2px solid #1c1917',
    color: '#8a827b',
    userSelect: 'none',
    fontFamily: 'var(--font-mono), monospace',
  },
  '.cm-gutter.cm-lineNumbers .cm-gutterElement:hover': { color: '#16a34a', cursor: 'pointer', fontWeight: '700' },
  '.cm-gutter.cm-lineNumbers .cm-gutterElement': { paddingLeft: '12px', paddingRight: '8px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: 'rgba(28,25,23,0.03)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(255, 212, 59, 0.45) !important',
  },
  '.cm-cursor': { borderLeftColor: '#1c1917' },
})

// Handoff syntax mapping: purple keywords, green strings, muted italic comments
const lightSyntax = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], color: '#7c3aed', fontWeight: '700' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#0f7a37' },
  { tag: [tags.comment, tags.blockComment, tags.lineComment], color: '#8a827b', fontStyle: 'italic' },
  { tag: [tags.number, tags.bool, tags.null], color: '#c2410c' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#1e40af' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#ca8a04' },
  { tag: [tags.propertyName, tags.attributeName], color: '#57534e' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: '#1c1917' },
  { tag: [tags.punctuation, tags.bracket, tags.operator], color: '#57534e' },
])

interface Props {
  code: string
  language: Language
  readOnly?: boolean
  onCommentsChange?: (comments: CodeComment[]) => void
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

  const [comments, setComments] = useState<InternalComment[]>(() =>
    initialComments.map((c) => ({
      ...c,
      widget: new InlineWidget(c.id),
      collapsed: false,
    })),
  )

  const [pendingForm, setPendingForm] = useState<PendingForm | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  // Flipped once the CodeMirror view exists — the decoration effect below must
  // re-run then, because react-codemirror attaches our extensions (including
  // decorationField) in an effect AFTER onCreateEditor fires, so any dispatch
  // sent earlier is silently dropped.
  const [viewReady, setViewReady] = useState(false)
  const selectionRef = useRef<{ start: number; end: number; text: string } | null>(null)

  useEffect(() => {
    onCommentsChange?.(
      comments.map(({ widget: _w, collapsed: _c, ...rest }) => rest),
    )
  }, [comments, onCommentsChange])

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
        ? { startLine: pendingForm.startLine, endLine: pendingForm.endLine, widget: pendingForm.widget }
        : null,
      view.state.doc,
    )
    view.dispatch({ effects: setDecorationsEffect.of(decos) })
    requestAnimationFrame(() => view.requestMeasure())
  }, [comments, pendingForm, viewReady])

  const openFormRef = useRef<(clickedLine: number) => void>(() => {})
  openFormRef.current = (clickedLine: number) => {
    if (readOnly) return
    if (pendingForm?.endLine === clickedLine) { setPendingForm(null); return }
    const sel = selectionRef.current
    const startLine = sel ? sel.start : clickedLine
    const endLine   = sel ? sel.end   : clickedLine
    const selectedText = sel ? sel.text : ''
    setPendingForm({ startLine, endLine, selectedText, widget: new InlineWidget(`form-${Date.now()}`) })
  }

  const lineNumbersExt = useMemo(
    () =>
      lineNumbers({
        domEventHandlers: {
          mousedown(view, line) {
            if (readOnly) return false
            const lineNum = view.state.doc.lineAt(line.from).number
            setTimeout(() => openFormRef.current(lineNum), 0)
            return true
          },
        },
      }),
    [readOnly],
  )

  const selectionExt = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet) return
        const sel = update.state.selection.main
        if (sel.empty) { selectionRef.current = null; return }
        const from = Math.min(sel.from, sel.to)
        const to   = Math.max(sel.from, sel.to)
        const startLine = update.state.doc.lineAt(from).number
        let endLine     = update.state.doc.lineAt(to).number
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

  const langExt = useMemo(
    () => (language === 'TypeScript' ? javascript({ typescript: true }) : java()),
    [language],
  )

  const extensions = useMemo(
    () => [langExt, decorationField, lineNumbersExt, selectionExt, editorTheme, syntaxHighlighting(lightSyntax)],
    [langExt, lineNumbersExt, selectionExt],
  )

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

  function editComment(id: string, text: string) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, comment: text } : c)))
    setEditingId(null)
  }

  function deleteComment(id: string) {
    if (editingId === id) setEditingId(null)
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== id)
      return next.map((c, i) => ({ ...c, colorIndex: i % COMMENT_COLORS.length }))
    })
  }

  function toggleCollapse(id: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed } : c)),
    )
  }

  const lineCount = code.split('\n').length

  return (
    <div className="relative flex flex-col">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-cream-2 border-2.5 border-b-0 border-ink rounded-t-pop">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-coral" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-hi" />
          <span className="w-3 h-3 rounded-full border-2 border-ink bg-brand" />
        </div>
        <span className="text-xs text-ink-2 font-mono font-bold">{language} · {lineCount} lines</span>
        {!readOnly ? (
          <span className="text-xs text-ink-2 font-medium">
            {comments.length > 0
              ? `${comments.length} annotation${comments.length !== 1 ? 's' : ''} · click line № to add`
              : 'Click a line number to annotate'}
          </span>
        ) : (
          <span className="text-xs text-brand font-bold">
            {comments.length > 0
              ? `${comments.length} annotation${comments.length !== 1 ? 's' : ''}`
              : 'No annotations'}
          </span>
        )}
      </div>

      <div className="border-2.5 border-ink rounded-b-pop overflow-hidden shadow-hard">
        <CodeMirror
          value={code}
          extensions={extensions}
          theme="none"
          editable={false}
          onCreateEditor={(view) => {
            viewRef.current = view
            setViewReady(true)
          }}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            searchKeymap: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>

      {comments.map((c) =>
        createPortal(
          editingId === c.id && !readOnly ? (
            <InlineCommentForm
              startLine={c.startLine}
              endLine={c.endLine}
              selectedText={c.selectedText}
              initialText={c.comment}
              saveLabel="Update comment"
              onSave={(text) => editComment(c.id, text)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <InlineCommentCard
              comment={c}
              readOnly={readOnly}
              onEdit={() => { setPendingForm(null); setEditingId(c.id) }}
              onDelete={() => deleteComment(c.id)}
              onToggleCollapse={() => toggleCollapse(c.id)}
            />
          ),
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
