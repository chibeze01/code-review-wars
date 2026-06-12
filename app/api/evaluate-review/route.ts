import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GeneratedCode, CodeComment, EvaluationResult } from '@/types'

export const dynamic = 'force-dynamic'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// Chess-style "!!" — bonus awarded per genuine unplanted flaw the candidate
// caught. Applied server-side so the model never does scoring arithmetic.
const BRILLIANT_BONUS = 10
const MAX_SCORE_WITH_BONUS = 120

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return raw.trim()
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
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
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`
    )
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> }
  return data.content[0]?.text ?? ''
}

function formatReviewForPrompt(comments: CodeComment[], generalNotes: string): string {
  const parts: string[] = []

  if (comments.length > 0) {
    parts.push('INLINE CODE ANNOTATIONS (with line numbers):')
    parts.push('─'.repeat(48))
    for (const c of comments) {
      const lineRef = c.startLine === c.endLine
        ? `Line ${c.startLine}`
        : `Lines ${c.startLine}–${c.endLine}`
      parts.push(`${lineRef}: "${c.comment}"`)
      if (c.selectedText.trim()) {
        const excerpt = c.selectedText.trim().slice(0, 120)
        const truncated = excerpt.length < c.selectedText.trim().length ? '…' : ''
        parts.push(`  (selected code: \`${excerpt}${truncated}\`)`)
      }
    }
  }

  if (generalNotes) {
    if (parts.length) parts.push('')
    parts.push('GENERAL REVIEW NOTES:')
    parts.push('─'.repeat(48))
    parts.push(generalNotes)
  }

  return parts.length ? parts.join('\n') : '(No review submitted)'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check credit balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  const { generated, comments, generalNotes, durationSeconds } = await request.json() as {
    generated: GeneratedCode
    comments: CodeComment[]
    generalNotes: string
    durationSeconds?: number
  }

  const system = `You are a senior software engineer and technical interviewer evaluating a candidate's code review skills.
The candidate may have left inline annotations on specific lines of code and/or written general notes.
Be fair but rigorous. Credit partial catches and good line-level annotations. Partial credit is fine.
The code was generated with a list of INTENTIONAL issues, but generated code can contain real flaws beyond that list.
When the candidate flags something not on the list, judge it on its merits: a genuine, defensible flaw is a rare
"brilliant find" (chess-style !!); an incorrect or pedantic flag is a false positive. Be strict — brilliant finds
should be uncommon and only awarded for real, clearly-identified problems.
Always respond with valid JSON only, no markdown fences.`

  const issueList = generated.issues
    .map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()} ${i.type}] ${i.description} (${i.lineHint})`)
    .join('\n')

  const reviewText = formatReviewForPrompt(comments, generalNotes)

  const userMsg = `You generated this ${generated.language} code for a code review exercise:

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

For anything the candidate flagged that is NOT one of the intentional issues above, classify it carefully:
- It identifies a GENUINE flaw that really exists in the code (a true bug, vulnerability, performance or
  correctness problem the generator never meant to plant) → put it in "brilliantFinds". Be strict: only award
  this for real, defensible, clearly-articulated problems. Never duplicate a planted issue here.
- It is actually fine, subjective, or wrong → put it in "falsePositives".
Score ONLY against the intentional issues (0-100). Do NOT add points for brilliant finds — the server awards
their bonus separately.

Return this exact JSON:
{
  "score": <0-100 integer>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "issuesFound": ["<issue # and what the candidate correctly identified, referencing their annotation if applicable>"],
  "issuesMissed": ["<issue # and why it matters — be educational>"],
  "falsePositives": ["<things the candidate flagged that are actually fine, with explanation — excluding brilliant finds>"],
  "brilliantFinds": ["<genuine unplanted flaws the candidate correctly caught, with explanation of why each is a real issue — empty array if none>"],
  "feedback": "<specific, actionable advice on how they can improve their code review skills — 3-5 bullet points as a single string with \\n between points>",
  "idealReview": "<what an expert review of this code would say — written as if you are the expert reviewer, covering all issues clearly with line references>",
  "issueResults": [<one entry for EVERY intentional issue listed above, in order: {"index": <1-based issue number>, "type": "<that issue's type>", "severity": "<that issue's severity>", "found": <true if the candidate identified it fully or partially, else false>}>]
}`

  try {
    const raw = await callClaude(system, userMsg)
    const evaluation = JSON.parse(extractJson(raw)) as EvaluationResult

    // Award the brilliant bonus deterministically — the model scores only
    // against planted issues; unplanted genuine finds add points on top
    if (!Array.isArray(evaluation.brilliantFinds)) evaluation.brilliantFinds = []
    if (evaluation.brilliantFinds.length > 0) {
      evaluation.score = Math.min(
        evaluation.score + BRILLIANT_BONUS * evaluation.brilliantFinds.length,
        MAX_SCORE_WITH_BONUS,
      )
    }

    // Deduct 1 credit atomically via DB function
    const { error: deductError } = await supabase.rpc('deduct_credit', { p_user_id: user.id })
    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 })
    }

    // Persist the session — durationSeconds rides along in the feedback jsonb
    // so no schema migration is needed for dashboard stats
    await supabase.from('review_sessions').insert({
      user_id: user.id,
      scenario: generated.scenario,
      language: generated.language,
      code: generated.code,
      annotations: comments,
      score: evaluation.score,
      grade: evaluation.grade,
      feedback: {
        ...evaluation,
        generatedIssues: generated.issues,
        durationSeconds: typeof durationSeconds === 'number' && durationSeconds > 0
          ? Math.round(durationSeconds)
          : null,
      },
      credits_used: 1,
    })

    // Return updated balance
    const { data: updated } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      evaluation,
      creditsRemaining: updated?.credits ?? profile.credits - 1,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Evaluation failed' },
      { status: 500 }
    )
  }
}
