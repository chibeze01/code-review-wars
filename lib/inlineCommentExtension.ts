import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view'

export class InlineWidget extends WidgetType {
  readonly id: string
  readonly dom: HTMLDivElement

  constructor(id: string) {
    super()
    this.id = id
    this.dom = document.createElement('div')
    this.dom.className = 'cm-inline-widget-host'
  }

  toDOM() { return this.dom }

  eq(other: WidgetType) {
    return other instanceof InlineWidget && other.id === this.id
  }

  get estimatedHeight() { return -1 }

  ignoreEvent() { return true }

  // Each widget owns its own `this.dom` (the React portal target), so a different
  // widget instance can never adopt another's node. Returning true here would tell
  // CodeMirror "I updated the existing DOM in place" — leaving the *old* widget's
  // node mounted and orphaning this widget's node (with the portal'd content). That
  // is exactly what made a freshly-saved comment invisible until a scroll forced a
  // full redraw. Return false so CodeMirror always re-mounts via toDOM() → this.dom.
  updateDOM() { return false }
}

export const setDecorationsEffect = StateEffect.define<DecorationSet>()

export const decorationField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setDecorationsEffect)) return e.value
    }
    return decos
  },
  provide: (f) => EditorView.decorations.from(f),
})

// Light "indie" palette — soft tinted backgrounds, strong bars, dark readable text
export const COMMENT_COLORS = [
  { bg: 'rgba(124, 58, 237, 0.08)', bar: '#7c3aed', text: '#5b21b6', badge: 'rgba(124,58,237,0.14)' },
  { bg: 'rgba(22, 163, 74,  0.08)', bar: '#16a34a', text: '#0f7a37', badge: 'rgba(22,163,74,0.14)'  },
  { bg: 'rgba(202,138, 4,   0.10)', bar: '#ca8a04', text: '#854d0e', badge: 'rgba(202,138,4,0.16)'  },
  { bg: 'rgba(59, 130, 246, 0.08)', bar: '#3b82f6', text: '#1e40af', badge: 'rgba(59,130,246,0.14)' },
  { bg: 'rgba(255,106, 61,  0.10)', bar: '#ff6a3d', text: '#c2410c', badge: 'rgba(255,106,61,0.16)' },
] as const

export interface CommentDeco {
  startLine: number
  endLine: number
  colorIndex: number
  widget: InlineWidget
}

export interface FormDeco {
  startLine: number
  endLine: number
  widget: InlineWidget
}

type DocLike = { lines: number; line(n: number): { from: number; to: number } }

export function buildDecorations(
  comments: CommentDeco[],
  form: FormDeco | null,
  doc: DocLike,
): DecorationSet {
  type Entry = { from: number; isLine: boolean; deco: Decoration }
  const entries: Entry[] = []

  for (const c of comments) {
    const col = COMMENT_COLORS[c.colorIndex % COMMENT_COLORS.length]

    for (let l = c.startLine; l <= c.endLine; l++) {
      if (l < 1 || l > doc.lines) continue
      const ln = doc.line(l)
      entries.push({
        from: ln.from,
        isLine: true,
        deco: Decoration.line({
          attributes: {
            style: `background-color:${col.bg}; border-left:3px solid ${col.bar};`,
          },
        }),
      })
    }

    const endL = Math.min(c.endLine, doc.lines)
    entries.push({
      from: doc.line(endL).to,
      isLine: false,
      deco: Decoration.widget({ widget: c.widget, block: true, side: 1 }),
    })
  }

  if (form) {
    const l = Math.max(1, Math.min(form.endLine, doc.lines))
    entries.push({
      from: doc.line(l).to,
      isLine: false,
      deco: Decoration.widget({ widget: form.widget, block: true, side: 2 }),
    })
  }

  entries.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from
    return (a.isLine ? 0 : 1) - (b.isLine ? 0 : 1)
  })

  const builder = new RangeSetBuilder<Decoration>()
  for (const { from, deco } of entries) {
    builder.add(from, from, deco)
  }
  return builder.finish()
}
