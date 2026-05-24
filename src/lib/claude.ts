import type { Language, GeneratedCode, EvaluationResult, CodeComment } from '../types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

async function callClaude(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`)
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> }
  return data.content[0]?.text ?? ''
}

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return raw.trim()
}

export async function generateCode(
  apiKey: string,
  language: Language,
  context: string
): Promise<GeneratedCode> {
  const system = `You are a code generation assistant for a code review practice application used in job interview prep.
Your job is to write realistic, plausible-looking ${language} code that contains intentional hidden issues.
The candidate must find these issues. Do NOT hint at the issues in comments or variable names — make the code look professional.
Always respond with valid JSON only, no markdown fences.`

  const user = `Generate a ${language} code snippet for this context:
"${context}"

Requirements:
- 60–120 lines of realistic, production-style code that fits the context
- Embed exactly 4–6 intentional issues across different categories
- At least 1 bug (logic error, off-by-one, null dereference, wrong operator, etc.)
- At least 1 security issue (SQL injection, missing auth check, sensitive data exposure, insecure config, etc.) if applicable
- At least 1 performance issue (N+1 query, missing index hint, repeated computation, unnecessary allocation, etc.)
- At least 1 code quality / maintainability issue
- Issues must be subtle — a junior dev would miss them, a senior dev would catch them
- The code should look like it was written by a competent but slightly rushed developer

Return this exact JSON structure:
{
  "code": "<the full code as a string with \\n for newlines>",
  "scenario": "<one sentence describing what this code does>",
  "issues": [
    {
      "type": "bug|security|performance|style|logic|error-handling",
      "severity": "critical|major|minor",
      "description": "<clear explanation of the issue>",
      "lineHint": "<approximate location like 'line 23' or 'the calculateTotal function'>"
    }
  ]
}`

  const raw = await callClaude(apiKey, system, user)
  const parsed = JSON.parse(extractJson(raw)) as Omit<GeneratedCode, 'language'>
  return { ...parsed, language }
}

function formatReviewForPrompt(comments: CodeComment[], generalNotes: string): string {
  const parts: string[] = []

  if (comments.length > 0) {
    parts.push('INLINE CODE ANNOTATIONS (with line numbers):')
    parts.push('─'.repeat(48))
    for (const c of comments) {
      const lineRef = c.startLine === c.endLine ? `Line ${c.startLine}` : `Lines ${c.startLine}–${c.endLine}`
      parts.push(`${lineRef}: "${c.comment}"`)
      if (c.selectedText.trim()) {
        const excerpt = c.selectedText.trim().slice(0, 120)
        parts.push(`  (selected code: \`${excerpt}${excerpt.length < c.selectedText.trim().length ? '…' : ''}\`)`)
      }
    }
  }

  if (generalNotes) {
    if (parts.length) parts.push('')
    parts.push('GENERAL REVIEW NOTES:')
    parts.push('─'.repeat(48))
    parts.push(generalNotes)
  }

  if (!parts.length) {
    return '(No review submitted)'
  }

  return parts.join('\n')
}

export async function evaluateReview(
  apiKey: string,
  generated: GeneratedCode,
  comments: CodeComment[],
  generalNotes: string,
): Promise<EvaluationResult> {
  const system = `You are a senior software engineer and technical interviewer evaluating a candidate's code review skills.
The candidate may have left inline annotations on specific lines of code and/or written general notes.
Be fair but rigorous. Credit partial catches and good line-level annotations. Partial credit is fine.
Always respond with valid JSON only, no markdown fences.`

  const issueList = generated.issues
    .map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()} ${i.type}] ${i.description} (${i.lineHint})`)
    .join('\n')

  const reviewText = formatReviewForPrompt(comments, generalNotes)

  const user = `You generated this ${generated.language} code for a code review exercise:

SCENARIO: ${generated.scenario}

CODE (with line numbers for reference):
\`\`\`
${generated.code.split('\n').map((l, i) => `${String(i + 1).padStart(3, ' ')} | ${l}`).join('\n')}
\`\`\`

INTENTIONAL ISSUES (hidden from candidate):
${issueList}

CANDIDATE'S REVIEW:
${reviewText}

Evaluate the full review — both inline annotations and general notes.
For inline annotations, assess whether the line reference correctly identifies a real issue.
Credit partial catches. Consider how clearly each issue was described and how actionable the feedback was.

Return this exact JSON:
{
  "score": <0-100 integer>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "issuesFound": ["<issue # and what the candidate correctly identified, referencing their annotation if applicable>"],
  "issuesMissed": ["<issue # and why it matters — be educational>"],
  "falsePositives": ["<things the candidate flagged that are actually fine, with explanation>"],
  "feedback": "<specific, actionable advice on how they can improve their code review skills — 3-5 bullet points as a single string with \\n between points>",
  "idealReview": "<what an expert review of this code would say — written as if you are the expert reviewer, covering all issues clearly with line references>"
}`

  const raw = await callClaude(apiKey, system, user)
  return JSON.parse(extractJson(raw)) as EvaluationResult
}
