import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view'

// Light "indie" palette — soft tinted backgrounds, dark readable text
export const COMMENT_COLORS = [
  { bg: 'rgba(124, 58, 237, 0.08)', border: '#7c3aed', tag: 'violet',  text: '#5b21b6' },
  { bg: 'rgba(22, 163, 74,  0.08)', border: '#16a34a', tag: 'emerald', text: '#0f7a37' },
  { bg: 'rgba(202, 138, 4,  0.10)', border: '#ca8a04', tag: 'amber',   text: '#854d0e' },
  { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', tag: 'blue',    text: '#1e40af' },
  { bg: 'rgba(255, 106, 61, 0.10)', border: '#ff6a3d', tag: 'coral',   text: '#c2410c' },
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
