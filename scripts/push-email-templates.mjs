#!/usr/bin/env node
/**
 * Push the branded auth email templates in supabase/templates/ to the hosted
 * Supabase project, via the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-email-templates.mjs
 *
 * Get a token at https://supabase.com/dashboard/account/tokens
 * Only the mailer subject/content fields below are touched — no other auth
 * config is changed.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'noeqryezqfeefcswtgqb'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const TEMPLATES = {
  confirmation: 'Confirm your email ⚔️ Code Review Wars',
  invite: "You've been invited to Code Review Wars ⚔️",
  magic_link: 'Your sign-in link — Code Review Wars',
  email_change: 'Confirm your new email — Code Review Wars',
  recovery: 'Reset your password — Code Review Wars',
  reauthentication: 'Your verification code — Code Review Wars',
}

if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (create one at https://supabase.com/dashboard/account/tokens)')
  process.exit(1)
}

const templatesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'templates')

const body = {}
for (const [name, subject] of Object.entries(TEMPLATES)) {
  body[`mailer_subjects_${name}`] = subject
  body[`mailer_templates_${name}_content`] = await readFile(path.join(templatesDir, `${name}.html`), 'utf8')
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

if (!res.ok) {
  console.error(`Failed (${res.status}): ${await res.text()}`)
  process.exit(1)
}

console.log(`Updated ${Object.keys(TEMPLATES).length} email templates on project ${PROJECT_REF}:`)
for (const [name, subject] of Object.entries(TEMPLATES)) {
  console.log(`  ✓ ${name} — "${subject}"`)
}
