# CLAUDE.md

Guidance for Claude working in this repo. Written answer-first: each section leads
with the rule, then the reasoning. When in doubt, follow the rule.

## Non-negotiables

- **Never add `Co-Authored-By: Claude` or any Claude/Anthropic attribution to
  commit messages, PR bodies, or code comments.** No "Generated with Claude Code"
  trailers either. Commits are authored by the human contributors, full stop.
- **Never delete, weaken, or silently rewrite working code, tests, or scope to
  make a task look done.** Do not remove functionality, drop test cases, loosen
  assertions, or stub things out to get green. If something genuinely needs to go,
  say so and ask first. Shrinking the codebase to dodge a hard problem is the one
  failure mode we will not tolerate.
- **Ask before large or destructive moves** — deleting files, rewriting a module
  wholesale, changing the frozen event-stream contract, or reformatting files you
  weren't asked to touch.

## How we build: YAGNI, fast and simple

We are building this fast. Default to the smallest thing that solves the task in
front of you.

- **Build what's asked, nothing more.** No speculative abstractions, config knobs,
  interfaces "for later," or generality nobody requested. If we need it later, we
  add it later.
- **Simple over clever.** Prefer the straightforward implementation. A reader
  should understand it on the first pass.
- **One task at a time.** Don't refactor unrelated code, rename things, or
  "improve" files outside the scope of the current task. Drive-by changes create
  review noise and hide the real diff.
- **Match the surrounding code.** Follow existing patterns, naming, and comment
  density. The docs and existing files set the house style — read them first.

YAGNI cuts speculative *additions*. It does not license gutting existing code
(see Non-negotiables). Minimal means "no more than needed," not "less than we
have."

## Communication style: caveman

Speak like a caveman. Ultra-compressed output, full technical accuracy. Active
every response — no drift back to prose after a few turns, no filler creep. Still
active if unsure.

- **Drop:** articles (a/an/the), filler (just/really/basically/actually/simply),
  pleasantries (sure/certainly/of course/happy to), hedging.
- **Fragments OK.** Short synonyms — "big" not "extensive", "fix" not "implement a
  solution for".
- **No** tool-call narration, decorative tables, or emoji. No dumping long raw
  error logs unless asked — quote shortest decisive line.
- **Standard tech acronyms OK** (DB/API/HTTP). Never invent new ones
  (cfg/impl/req/res/fn) — tokenizer splits them the same, zero saved, harder to
  read. Full word cheaper and clearer.
- **No causal arrows.** They cost a token, save nothing.
- **Keep verbatim:** technical terms, code blocks, API names, CLI commands,
  commit-type keywords (feat/fix/...), exact error strings.
- **No self-reference.** Never name or announce the style. No "caveman mode on",
  no "me caveman think", no `Caveman:` recap alongside a normal answer. Only
  exception: user asks what the mode is.

Pattern: `[thing] [action] [reason]. [next step].`

Not: "Sure! I'd be happy to help. The issue is likely caused by..."
Yes: "Bug in auth middleware. Token expiry check use < not <=. Fix:"

## Working style

- **Answer first, then context.** Lead with the result or recommendation, then the
  reasoning. Don't narrate options you won't pursue.
- **When you have enough to act, act.** Don't re-ask settled decisions or
  over-explore. If a sensible default exists, take it and say so.
- **Small, reviewable diffs.** Keep changes scoped to the ticket. Explain what
  changed and why in a sentence or two.
- **Flag uncertainty plainly.** If tests fail, say so with the output. If you
  skipped something, say that. Don't claim done until it's verified.

## Worktree placement

Always create worktrees as **siblings** of the main repo, never inside it.

- Main repo: `C:\GIT\code-review-wars`
- Worktree:  `C:\GIT\<branch-name>`

Example:
```
C:\GIT\code-review-wars   ← main
C:\GIT\Mobile-artifact    ← worktree (sibling, not nested)
```

Never place worktrees under `.claude\worktrees\` or any subdirectory of the main repo.

## Project Facts

**What it is:** Code Review Wars (codereviewwars.dev) — interview prep for the
code-review round. Generates realistic buggy code (TypeScript/C#), user reviews
it with inline comments, an AI staff engineer grades the review. Credit-based:
3 free credits on signup, then Stripe credit packs.

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript, Tailwind 3,
CodeMirror 6 for the diff/editor UI. Supabase for auth + Postgres. Stripe for
payments. Anthropic API for generation/grading. Hosted on Vercel.

**Design:** neo-brutalist "indie" theme — cream `#fffaf0` background, ink
`#1c1917` borders, hard offset shadows (`shadow-hard`), brand green `#16a34a`.
Fonts: Bricolage Grotesque (display), Inter (body), JetBrains Mono. Reusable
classes (`btn-pop`, `card-pop`, `tag-pop`) live in `app/globals.css`.

**Key paths:**
- `app/` — routes (landing, login/signup, dashboard, train, history, billing, pricing)
- `supabase/migrations/` — schema, numbered 001+; RPCs for credits/sessions are
  locked to service_role (see 004–007)
- `supabase/templates/` + `supabase/config.toml` — branded auth email templates;
  deploy via `npx supabase config push` or `scripts/push-email-templates.mjs`
- `middleware.ts` — Supabase session refresh + auth-gated routes

**Environments / services:**
- Supabase project: `code-review-wars`, ref `noeqryezqfeefcswtgqb` (eu-west-1)
- Vercel: team `chibeze-s-projects`, project `code-review-wars`, prod domain
  `codereviewwars.dev`. Env vars there are **Sensitive** (write-only — cannot be
  pulled back; source secrets from Supabase/Stripe/Anthropic dashboards)
- Stripe packs: Starter 10/$5, Standard 50/$18, Pro 150/$45 (price IDs in env)
- Local dev: `npm run dev`, needs `.env.local` (names in `.env.example`);
  Supabase URL + anon key are enough for the UI, server features need the rest

**Gotchas:**
- `supabase config push` pushes CLI defaults for every auth key NOT declared in
  `config.toml` — it can silently overwrite production auth settings (site_url,
  confirmations, MFA). Declare production values explicitly; always review the
  diff before confirming.
- Auth is email/password only (no OAuth providers, no custom SMTP yet).
- Stripe webhook is idempotent (see migration 006 + commit b2ca229); keep it so.