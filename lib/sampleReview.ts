import type { CodeComment, EvaluationResult, GeneratedCode } from '@/types'

// Frozen worked example for /sample.
// TODO(launch): `evaluation` below is hand-authored in the grader's shape.
// Replace it with real output by running scripts/grade-sample.mjs against a
// live ANTHROPIC_API_KEY (same prompt + model as app/api/evaluate-review), and
// re-run whenever the grading prompt changes.

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

const challenge: GeneratedCode = {
  language: 'TypeScript',
  scenario:
    'Refund service for a payments API: validates a refund request against the original payment, restocks inventory, issues the refund through Stripe and records it in the ledger.',
  code,
  issues: [
    { type: 'security', severity: 'critical', description: 'paymentId is interpolated directly into the SQL string in the payments lookup, allowing SQL injection', lineHint: 'line 16' },
    { type: 'bug', severity: 'critical', description: 'The refund-total check and the refunds INSERT are not atomic: two concurrent requests both read the same SUM, both pass the check, and the payment is over-refunded', lineHint: 'lines 27–33 and 61–64' },
    { type: 'error-handling', severity: 'major', description: 'A failed Stripe refund is only logged; the function still inserts a refund row (with a null stripe_id) and returns ok: true, so the ledger says refunded while the customer received nothing', lineHint: 'lines 52–59' },
    { type: 'performance', severity: 'major', description: 'N+1 query: products are fetched and updated one row at a time inside the loop over payment items', lineHint: 'lines 43–49' },
    { type: 'logic', severity: 'minor', description: 'Fee is computed in floating point on cents (amountCents * 0.029), producing fractional cents in net_cents; money arithmetic should be integer-based with explicit rounding', lineHint: 'lines 35–36' },
  ],
}

const codeLines = code.split('\n')
const selected = (start: number, end: number) => codeLines.slice(start - 1, end).join('\n')

const comments: CodeComment[] = [
  { id: 'c1', startLine: 15, endLine: 17, colorIndex: 0, comment: '`req.paymentId` is interpolated straight into the SQL string — this is SQL injection. Every other query in this file uses `$1` placeholders; this one needs to as well.' },
  { id: 'c2', startLine: 27, endLine: 33, colorIndex: 1, comment: 'Check-then-act race. Two concurrent refund requests for the same payment both read the same SUM, both pass this check, and both insert — the payment gets over-refunded. Needs `SELECT ... FOR UPDATE` on the payment row inside a transaction, or a DB-level constraint on the total.' },
  { id: 'c3', startLine: 43, endLine: 49, colorIndex: 2, comment: 'N+1: one SELECT and one UPDATE per line item. Load all products with `WHERE id = ANY($1)` and restock in a single statement.' },
  { id: 'c4', startLine: 45, endLine: 48, colorIndex: 3, comment: "Inventory is restocked before we know the Stripe refund went through. If Stripe fails we've handed stock back without refunding anyone. Move this after the refund, inside the same transaction as the insert." },
  { id: 'c5', startLine: 57, endLine: 59, colorIndex: 4, comment: 'Swallowed failure. If Stripe throws we log a warning and carry on: the refund row is still inserted with a null `stripe_id` and the caller sees `ok: true`. Customer gets no money, our ledger says they did. Rethrow here and do not write the row.' },
  { id: 'c6', startLine: 12, endLine: 12, colorIndex: 0, comment: 'Nit: would prefer `MAX_REFUND_WINDOW_DAYS` to come from config rather than a module constant so ops can tune it without a deploy.' },
].map((c) => ({ ...c, selectedText: selected(c.startLine, c.endLine) }))

const generalNotes =
  "Happy path is fine; the failure and concurrency paths are not. I'd block merge on the injection (L16) and the swallowed Stripe error (L57–59), and want the race on the refund total fixed before this touches real money. The N+1 and the restock ordering can be follow-ups if there's a deadline, but they're cheap to fix now."

const evaluation: EvaluationResult = {
  // 82 against the planted issues, +10 brilliant-find bonus applied server-side.
  score: 92,
  grade: 'A',
  summary:
    'A strong, production-minded review. The candidate caught both critical issues and both major ones with precise line references and concrete fixes, and correctly prioritised what should block the merge. One minor issue was missed and one annotation was a preference rather than a defect.',
  issuesFound: [
    'Issue #1 (SQL injection, line 16): correctly identified the interpolated paymentId and pointed to the parameterised style used elsewhere in the file — clear and immediately actionable.',
    'Issue #2 (non-atomic refund total, lines 27–33): identified the check-then-act race precisely, explained the over-refund consequence, and proposed two valid fixes (row lock in a transaction, or a database constraint).',
    'Issue #3 (swallowed Stripe failure, lines 57–59): caught that the refund row is still written with a null stripe_id and ok: true is returned; spelled out the customer-facing consequence and the fix (rethrow, skip the write).',
    'Issue #4 (N+1 over payment items, lines 43–49): identified the per-item SELECT and UPDATE and suggested a single ANY($1) load plus a batched restock.',
  ],
  issuesMissed: [
    'Issue #5 (floating-point fee arithmetic, lines 35–36): amountCents * 0.029 + 30 produces fractional cents, which then flow into an integer net_cents column and the return value. Money should be computed in integer minor units with explicit rounding (e.g. Math.round). Small on its own, but in a refund path rounding drift is exactly the kind of bug that surfaces as a reconciliation mismatch months later.',
  ],
  falsePositives: [
    'Line 12 (MAX_REFUND_WINDOW_DAYS as a module constant): a stylistic preference, not a defect. A named constant is a perfectly acceptable place for a policy value; moving it to config is a product decision, not a code review finding. Flagging it as a "nit" was the right tone, but it does not earn credit.',
  ],
  brilliantFinds: [
    'Lines 45–48 (inventory restocked before the refund succeeds): a genuine ordering bug the generator did not plant. Stock is written back to products before the Stripe call, so a failed refund leaves inventory inflated with no compensating action. The candidate identified the side effect, the failure mode and the fix (move restocking after the refund, inside the same transaction as the ledger write).',
  ],
  feedback:
    'Scan every arithmetic expression that touches money for floats. You checked injection, concurrency and error handling systematically — add "is this number an integer in minor units?" to the same checklist and the fee bug would have been a five-second catch.\n' +
    'Keep separating "blocks merge" from "follow-up" the way you did in the general notes. That prioritisation is exactly what interviewers listen for; it shows you understand blast radius, not just correctness.\n' +
    'Before leaving a preference as a comment, ask whether the code would be wrong without the change. If not, either drop it or label it as optional so it does not dilute your real findings.\n' +
    'Your ordering catch on restocking came from tracing side effects in sequence. Do that deliberately on every function that mixes external calls and database writes — it is the fastest way to find the flaws nobody planted.',
  idealReview:
    'Line 16 — Critical (security): req.paymentId is interpolated into the SQL string. This is a textbook SQL injection; use a parameterised query as every other statement in this function already does.\n\n' +
    'Lines 27–33 and 61–64 — Critical (correctness): the refund-total check and the INSERT are not atomic. Two concurrent requests read the same SUM, both pass, both insert, and the payment is over-refunded. Wrap the check and the write in a transaction with SELECT ... FOR UPDATE on the payment row, or enforce the invariant with a database constraint.\n\n' +
    'Lines 52–59 — Major (error handling): a Stripe failure is logged and then ignored. The function proceeds to record a refund with a null stripe_id and returns ok: true, so the ledger claims money moved when it did not. Rethrow (or return a failure) and never write the ledger row unless the refund succeeded.\n\n' +
    'Lines 43–49 — Major (performance): one SELECT plus one UPDATE per line item. Load all products in one query with WHERE id = ANY($1) and restock with a single UPDATE.\n\n' +
    'Lines 45–48 — Major (correctness): restocking runs before the refund is confirmed, so a failed refund leaves inventory inflated. Move restocking after the Stripe call and into the same transaction as the ledger write so the whole refund commits or rolls back together.\n\n' +
    'Lines 35–36 — Minor (logic): fee and netCents are computed in floating point on cent values, producing fractional cents. Compute in integer minor units and round explicitly.\n\n' +
    'Overall: block merge on the injection, the race and the swallowed Stripe error. The remaining items are cheap to fix and should go in the same change.',
  issueResults: [
    { index: 1, type: 'security', severity: 'critical', found: true },
    { index: 2, type: 'bug', severity: 'critical', found: true },
    { index: 3, type: 'error-handling', severity: 'major', found: true },
    { index: 4, type: 'performance', severity: 'major', found: true },
    { index: 5, type: 'logic', severity: 'minor', found: false },
  ],
}

export const SAMPLE = {
  challenge,
  comments,
  generalNotes,
  evaluation,
  gradedAt: '2026-09-13',
  model: 'claude-sonnet-4-6',
}
