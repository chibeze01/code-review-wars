import { parser } from '@lezer/javascript'
import { highlightTree, tagHighlighter, tags } from '@lezer/highlight'

// Server-side twin of the editor's HighlightStyle (components/AnnotatedCodeEditor)
// so a static listing looks like the live CodeMirror one. Class names map to
// the .tok-* rules in globals.css.
const highlighter = tagHighlighter([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword], class: 'tok-kw' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], class: 'tok-str' },
  { tag: [tags.comment, tags.blockComment, tags.lineComment], class: 'tok-cmt' },
  { tag: [tags.number, tags.bool, tags.null], class: 'tok-num' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: 'tok-fn' },
  { tag: [tags.typeName, tags.className, tags.namespace], class: 'tok-type' },
  { tag: [tags.propertyName, tags.attributeName], class: 'tok-prop' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], class: 'tok-var' },
  { tag: [tags.punctuation, tags.bracket, tags.operator], class: 'tok-punct' },
])

export interface Token {
  text: string
  className: string | null
}

export function highlightTypeScript(code: string): Token[][] {
  const tree = parser.configure({ dialect: 'ts' }).parse(code)
  const lines: Token[][] = [[]]

  const push = (from: number, to: number, className: string | null) => {
    code.slice(from, to).split('\n').forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ text: part, className })
    })
  }

  let pos = 0
  highlightTree(tree, highlighter, (from, to, classes) => {
    if (from > pos) push(pos, from, null)
    push(from, to, classes)
    pos = to
  })
  if (pos < code.length) push(pos, code.length, null)

  return lines
}
