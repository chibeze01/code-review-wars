import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Language, Domain, GeneratedCode } from '@/types'

export const dynamic = 'force-dynamic'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const DOMAIN_CONTEXTS: Record<string, string> = {
  ecommerce:  'E-commerce platform backend — service handling product catalog, cart operations, order processing, and payment flows',
  fintech:    'Fintech platform — investment portfolio management, transaction processing, P&L calculations, and compliance checks',
  healthcare: 'Healthcare records system — patient data management, appointment scheduling, and insurance billing',
  devtools:   'Developer tools / SaaS infrastructure — build pipelines, SDK code, CLI tools, or developer-facing APIs',
  saas:       'B2B SaaS application — user management, subscription billing, feature flags, and multi-tenant data isolation',
  general:    'General web application backend — REST API with authentication, data validation, and database operations',
}

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
      model: 'claude-haiku-4-5-20251001',
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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { language: Language; domain: Domain; context?: string }
  const { language, domain, context } = body

  if (!language || !domain) {
    return NextResponse.json({ error: 'Missing language or domain' }, { status: 400 })
  }
  if (domain === 'custom' && !context?.trim()) {
    return NextResponse.json({ error: 'Custom domain requires a context description' }, { status: 400 })
  }

  // Check the snippet bank for standard domains
  if (domain !== 'custom') {
    const { data: seenRows } = await supabase
      .from('user_seen_snippets')
      .select('snippet_id')
      .eq('user_id', user.id)

    const seenIds = (seenRows ?? []).map((r: { snippet_id: string }) => r.snippet_id)

    let query = supabase
      .from('code_snippets')
      .select('id, scenario, code, issues')
      .eq('language', language)
      .eq('domain', domain)

    if (seenIds.length > 0) {
      query = query.not('id', 'in', `(${seenIds.join(',')})`)
    }

    const { data: available } = await query.limit(10)

    if (available && available.length > 0) {
      const snippet = available[Math.floor(Math.random() * available.length)] as {
        id: string; scenario: string; code: string; issues: GeneratedCode['issues']
      }

      await supabase.from('user_seen_snippets').upsert(
        { user_id: user.id, snippet_id: snippet.id },
        { onConflict: 'user_id,snippet_id', ignoreDuplicates: true }
      )

      return NextResponse.json({
        code: snippet.code,
        scenario: snippet.scenario,
        issues: snippet.issues,
        language,
      } satisfies GeneratedCode)
    }
  }

  // Bank miss or custom domain — generate with Haiku
  const effectiveContext = domain !== 'custom' ? DOMAIN_CONTEXTS[domain] : context!

  const system = `You are a code generation assistant for a code review practice application used in job interview prep.
Your job is to write realistic, plausible-looking ${language} code that contains intentional hidden issues.
The candidate must find these issues. Do NOT hint at the issues in comments or variable names — make the code look professional.
Always respond with valid JSON only, no markdown fences.`

  const userMsg = `Generate a ${language} code snippet for this context:
"${effectiveContext}"

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

  try {
    const raw = await callClaude(system, userMsg)
    const parsed = JSON.parse(extractJson(raw)) as Omit<GeneratedCode, 'language'>

    // Store in bank so future users skip the generation cost
    if (domain !== 'custom') {
      const { data: newSnippet } = await supabase
        .from('code_snippets')
        .insert({ language, domain, scenario: parsed.scenario, code: parsed.code, issues: parsed.issues })
        .select('id')
        .single()

      if (newSnippet) {
        await supabase.from('user_seen_snippets').upsert(
          { user_id: user.id, snippet_id: newSnippet.id },
          { onConflict: 'user_id,snippet_id', ignoreDuplicates: true }
        )
      }
    }

    return NextResponse.json({ ...parsed, language } satisfies GeneratedCode)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
