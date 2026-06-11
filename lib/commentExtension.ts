import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view'

export const COMMENT_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.22)', border: '#7c3aed', tag: 'violet',  text: '#c4b5fd' },
  { bg: 'rgba(16,  185, 129, 0.22)', border: '#059669', tag: 'emerald', text: '#6ee7b7' },
  { bg: 'rgba(245, 158, 11,  0.22)', border: '#d97706', tag: 'amber',   text: '#fcd34d' },
  { bg: 'rgba(59,  130, 246, 0.22)', border: '#2563eb', tag: 'blue',    text: '#93c5fd' },
  { bg: 'rgba(244, 63,  94,  0.22)', border: '#e11d48', tag: 'rose',    text: '#fda4af' },
] as const

export interface HighlightRange {
  startLine: number
  endLine: number
  colorIndex: number
}

export const setHighlightsEffect = StateEffect.define<HighlightRange[]>()

export const lineHighlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,

  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightsEffect)) {
        const builder = new RangeSetBuilder<Decoration>()

        const lineEntries: Array<{ line: number; bg: string }> = []
        for (const { startLine, endLine, colorIndex } of effect.value) {
          const color = COMMENT_COLORS[colorIndex % COMMENT_COLORS.length]
          for (let l = startLine; l <= endLine; l++) {
            lineEntries.push({ line: l, bg: color.bg })
          }
        }
        lineEntries.sort((a, b) => a.line - b.line)

        const seen = new Set<number>()
        const docLines = tr.state.doc.lines
        for (const { line, bg } of lineEntries) {
          if (!seen.has(line) && line >= 1 && line <= docLines) {
            seen.add(line)
            const lineObj = tr.state.doc.line(line)
            builder.add(
              lineObj.from,
              lineObj.from,
              Decoration.line({ attributes: { style: `background-color: ${bg};` } }),
            )
          }
        }

        return builder.finish()
      }
    }
    return decorations
  },

  provide: (f) => EditorView.decorations.from(f),
})
