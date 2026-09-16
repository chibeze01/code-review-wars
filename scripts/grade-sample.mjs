// Usage: node scripts/grade-sample.mjs  (needs a live ANTHROPIC_API_KEY in .env.local)
// Grades the /sample fixture with the exact prompt + model used by
// app/api/evaluate-review/route.ts so the public example is a real grader output.
import { readFileSync, writeFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)

const code = `import { db } from './db'
import { stripe } from './stripe'
import { logger } from './logger'

interface RefundRequest {
  paymentId: string
  amountCents: number
  reason: string
  requestedBy: string
}

const MAX_REFUND_WINDOW_DAYS = 90

export async function processRefund(req: RefundRequest) {
  const payment = await db.queryOne(
    \`SELECT * FROM payments WHERE id = '\${req.paymentId}'\`
  )
  if (!payment) {
    throw new Error('Payment not found')
  }

  const ageDays = (Date.now() - payment.createdAt.getTime()) / 86400000
  if (ageDays > MAX_REFUND_WINDOW_DAYS) {
    throw new Error('Refund window has closed')
  }

  const refunded = await db.queryOne(
    'SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds WHERE payment_id = $1',
    [req.paymentId]
  )
  if (refunded.total + req.amountCents > payment.amountCents) {
    throw new Error('Refund exceeds original payment')
  }

  const fee = req.amountCents * 0.029 + 30
  const netCents = req.amountCents - fee

  const items = await db.query(
    'SELECT * FROM payment_items WHERE payment_id = $1',
    [req.paymentId]
  )
  const restocked: string[] = []
  for (const item of items) {
    const product = await db.queryOne('SELECT * FROM products WHERE id = $1', [item.productId])
    if (product.trackInventory) {
      await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.qty, product.id])
      restocked.push(product.id)
    }
  }

  let stripeRefund
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: payment.stripeIntentId,
      amount: req.amountCents,
    })
  } catch (err) {
    logger.warn('stripe refund failed', err)
  }

  await db.query(
    'INSERT INTO refunds (payment_id, amount_cents, net_cents, reason, requested_by, stripe_id) VALUES ($1, $2, $3, $4, $5, $6)',
    [req.paymentId, req.amountCents, netCents, req.reason, req.requestedBy, stripeRefund?.id]
  )

  return { ok: true, refundId: stripeRefund?.id, netCents, restocked }
}`

const scenario = 'Refund service for a payments API: validates a refund request against the original payment, restocks inventory, issues the refund through Stripe and records it in the ledger.'

const issues = [
  { type: 'security', severity: 'critical', description: 'paymentId is interpolated directly into the SQL string in the payments lookup, allowing SQL injection', lineHint: 'line 16' },
  { type: 'bug', severity: 'critical', description: 'The refund-total check and the refunds INSERT are not atomic: two concurrent requests both read the same SUM, both pass the check, and the payment is over-refunded', lineHint: 'lines 27–33 and 61–64' },
  { type: 'error-handling', severity: 'major', description: 'A failed Stripe refund is only logged; the function still inserts a refund row (with a null stripe_id) and returns ok: true, so the ledger says refunded while the customer received nothing', lineHint: 'lines 52–59' },
  { type: 'performance', severity: 'major', description: 'N+1 query: products are fetched and updated one row at a time inside the loop over payment items', lineHint: 'lines 43–49' },
  { type: 'logic', severity: 'minor', description: 'Fee is computed in floating point on cents (amountCents * 0.029), producing fractional cents in net_cents; money arithmetic should be integer-based with explicit rounding', lineHint: 'lines 35–36' },
]

const codeLines = code.split('\n')
const sel = (a, b) => codeLines.slice(a - 1, b).join('\n')

const comments = [
  { id: 'c1', startLine: 15, endLine: 17, colorIndex: 0, comment: '`req.paymentId` is interpolated straight into the SQL string — this is SQL injection. Every other query in this file uses `$1` placeholders; this one needs to as well.' },
  { id: 'c2', startLine: 27, endLine: 33, colorIndex: 1, comment: 'Check-then-act race. Two concurrent refund requests for the same payment both read the same SUM, both pass this check, and both insert — the payment gets over-refunded. Needs `SELECT ... FOR UPDATE` on the payment row inside a transaction, or a DB-level constraint on the total.' },
  { id: 'c3', startLine: 43, endLine: 49, colorIndex: 2, comment: 'N+1: one SELECT and one UPDATE per line item. Load all products with `WHERE id = ANY($1)` and restock in a single statement.' },
  { id: 'c4', startLine: 45, endLine: 48, colorIndex: 3, comment: "Inventory is restocked before we know the Stripe refund went through. If Stripe fails we've handed stock back without refunding anyone. Move this after the refund, inside the same transaction as the insert." },
  { id: 'c5', startLine: 57, endLine: 59, colorIndex: 4, comment: 'Swallowed failure. If Stripe throws we log a warning and carry on: the refund row is still inserted with a null `stripe_id` and the caller sees `ok: true`. Customer gets no money, our ledger says they did. Rethrow here and do not write the row.' },
  { id: 'c6', startLine: 12, endLine: 12, colorIndex: 0, comment: 'Nit: would prefer `MAX_REFUND_WINDOW_DAYS` to come from config rather than a module constant so ops can tune it without a deploy.' },
].map((c) => ({ ...c, selectedText: sel(c.startLine, c.endLine) }))

const generalNotes = "Happy path is fine; the failure and concurrency paths are not. I'd block merge on the injection (L16) and the swallowed Stripe error (L57–59), and want the race on the refund total fixed before this touches real money. The N+1 and the restock ordering can be follow-ups if there's a deadline, but they're cheap to fix now."

// ---- verbatim from app/api/evaluate-review/route.ts ----
function formatReviewForPrompt(comments, generalNotes) {
  const parts = []
  if (comments.length > 0) {
    parts.push('INLINE CODE ANNOTATIONS (with line numbers):')
    parts.push('─'.repeat(48))
    for (const c of comments) {
      const lineRef = c.startLine === c.endLine ? `Line ${c.startLine}` : `Lines ${c.startLine}–${c.endLine}`
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

const system = `You are a senior software engineer and technical interviewer evaluating a candidate's code review skills.
The candidate may have left inline annotations on specific lines of code and/or written general notes.
Be fair but rigorous. Credit partial catches and good line-level annotations. Partial credit is fine.
The code was generated with a list of INTENTIONAL issues, but generated code can contain real flaws beyond that list.
When the candidate flags something not on the list, judge it on its merits: a genuine, defensible flaw is a rare
"brilliant find" (chess-style !!); an incorrect or pedantic flag is a false positive. Be strict — brilliant finds
should be uncommon and only awarded for real, clearly-identified problems.
Always respond with valid JSON only, no markdown fences.`

const issueList = issues.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()} ${i.type}] ${i.description} (${i.lineHint})`).join('\n')
const reviewText = formatReviewForPrompt(comments, generalNotes)

const userMsg = `You generated this TypeScript code for a code review exercise:

SCENARIO: ${scenario}

CODE (with line numbers for reference):
\`\`\`
${code.split('\n').map((l, i) => `${String(i + 1).padStart(3, ' ')} | ${l}`).join('\n')}
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

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system, messages: [{ role: 'user', content: userMsg }] }),
})
if (!res.ok) { console.error(await res.text()); process.exit(1) }
const data = await res.json()
const raw = data.content[0]?.text ?? ''
const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
const jsonText = fence ? fence[1].trim() : (raw.match(/\{[\s\S]*\}/)?.[0] ?? raw.trim())
const evaluation = JSON.parse(jsonText)

// Server-side brilliant bonus, as in the route.
if (!Array.isArray(evaluation.brilliantFinds)) evaluation.brilliantFinds = []
if (evaluation.brilliantFinds.length > 0) {
  evaluation.score = Math.min(evaluation.score + 10 * evaluation.brilliantFinds.length, 120)
}

const out = { scenario, code, issues, comments, generalNotes, evaluation, gradedAt: new Date().toISOString().slice(0, 10), model: 'claude-sonnet-4-6' }
writeFileSync(new URL('../sample-eval.json', import.meta.url), JSON.stringify(out, null, 2))
console.log(JSON.stringify({ score: evaluation.score, grade: evaluation.grade, found: evaluation.issuesFound.length, missed: evaluation.issuesMissed.length, fp: evaluation.falsePositives.length, brilliant: evaluation.brilliantFinds.length }))
