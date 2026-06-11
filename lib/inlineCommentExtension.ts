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

  updateDOM() { return true }
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

export const COMMENT_COLORS = [
  { bg: 'rgba(124, 58, 237, 0.10)', bar: '#7c3aed', text: '#c4b5fd', badge: 'rgba(124,58,237,0.25)' },
  { bg: 'rgba(5,  150, 105, 0.10)', bar: '#059669', text: '#6ee7b7', badge: 'rgba(5,150,105,0.25)' },
  { bg: 'rgba(217,119,  6, 0.10)', bar: '#d97706', text: '#fcd34d', badge: 'rgba(217,119,6,0.25)'  },
  { bg: 'rgba(37, 99,  235, 0.10)', bar: '#2563eb', text: '#93c5fd', badge: 'rgba(37,99,235,0.25)' },
  { bg: 'rgba(225, 29, 72, 0.10)', bar: '#e11d48', text: '#fda4af', badge: 'rgba(225,29,72,0.25)'  },
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
