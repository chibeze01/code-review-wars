export type Language = 'TypeScript' | 'C#'

export type IssueType = 'bug' | 'security' | 'performance' | 'style' | 'logic' | 'error-handling'
export type IssueSeverity = 'critical' | 'major' | 'minor'

export interface CodeIssue {
  type: IssueType
  severity: IssueSeverity
  description: string
  lineHint: string
}

export interface GeneratedCode {
  code: string
  scenario: string
  issues: CodeIssue[]
  language: Language
}

export interface EvaluationResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  issuesFound: string[]
  issuesMissed: string[]
  falsePositives: string[]
  feedback: string
  idealReview: string
}

export interface SelectionInfo {
  startLine: number
  endLine: number
  selectedText: string
}

export interface CodeComment {
  id: string
  startLine: number
  endLine: number
  selectedText: string
  comment: string
  colorIndex: number
}

export type AppPhase =
  | 'setup'
  | 'generating'
  | 'reviewing'
  | 'evaluating'
  | 'feedback'
