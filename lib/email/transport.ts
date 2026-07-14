import nodemailer, { type Transporter } from 'nodemailer'

// Single shared transport across warm invocations — avoids reconnecting per email.
let cached: Transporter | null = null

/**
 * Build (or reuse) the SMTP transport from env. Returns null when SMTP isn't
 * configured so callers can no-op gracefully instead of throwing (e.g. preview
 * deploys that have no mail credentials).
 */
export function getTransport(): Transporter | null {
  if (cached) return cached

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const port = Number(process.env.SMTP_PORT ?? 465)

  if (!host || !user || !pass) return null

  cached = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS; 587 = STARTTLS upgrade.
    secure: port === 465,
    auth: { user, pass },
    // Bound every phase so a dead SMTP host fails fast instead of hanging the
    // serverless function until the platform kills it.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  return cached
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'Code Review Wars <receipts@codereviewwars.dev>'
}
