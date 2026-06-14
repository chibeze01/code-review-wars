export type Language = 'TypeScript' | 'C#'

export type Domain = 'ecommerce' | 'fintech' | 'healthcare' | 'devtools' | 'saas' | 'general' | 'custom'

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

// generate-code response — a session is started (and a credit deducted) at
// generation time, so the client gets the session id and updated balance back.
export interface GenerateResponse extends GeneratedCode {
  sessionId: string
  creditsRemaining: number
}

// An unfinished session restored when the user reloads or resumes from history.
export interface InProgressSession {
  id: string
  code: string
  scenario: string
  language: Language
  issues: CodeIssue[]
  domain: Domain
  // The original custom-domain prompt, restored so a resumed custom session can
  // still generate the next challenge. Null for the built-in domains.
  context: string | null
  annotations: CodeComment[]
  generalNotes: string
}

// Structured per-issue outcome — powers the category performance charts
export interface IssueResult {
  index: number
  type: IssueType
  severity: IssueSeverity
  found: boolean
}

export interface EvaluationResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  issuesFound: string[]
  issuesMissed: string[]
  falsePositives: string[]
  // Chess-style "!!" — genuine flaws the candidate caught that were never
  // intentionally planted. Each one earns bonus points on top of the score.
  brilliantFinds?: string[]
  feedback: string
  idealReview: string
  issueResults?: IssueResult[]
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
