# Auth email templates

Branded Supabase auth emails matching the site's neo-brutalist theme (cream
`#fffaf0` background, ink `#1c1917` borders with hard offset shadows, brand
green `#16a34a` CTA). All layout is table-based with inline styles so they
render correctly in Gmail, Outlook, and Apple Mail; the border-radius/shadow
degrade gracefully where unsupported.

| File | Supabase template | Subject |
| --- | --- | --- |
| `confirmation.html` | Confirm signup | Confirm your email ⚔️ Code Review Wars |
| `invite.html` | Invite user | You've been invited to Code Review Wars ⚔️ |
| `magic_link.html` | Magic link | Your sign-in link — Code Review Wars |
| `email_change.html` | Change email address | Confirm your new email — Code Review Wars |
| `recovery.html` | Reset password | Reset your password — Code Review Wars |
| `reauthentication.html` | Reauthentication | Your verification code — Code Review Wars |

Every template states why the recipient got it, what happens if they ignore
it, and includes a copy-paste fallback link (except reauthentication, which is
a code, not a link).

## Deploying changes

These files are the source of truth; editing them does nothing until pushed
to the Supabase project.

**Option A — script (recommended):**

```sh
SUPABASE_ACCESS_TOKEN=sbp_... node scripts/push-email-templates.mjs
```

Token from https://supabase.com/dashboard/account/tokens. The script only
patches the six mailer subject/content fields — no other auth config.

**Option B — dashboard:** Supabase Dashboard → Authentication → Emails →
Templates, paste each file's HTML and the subject from the table above.

## Related (not Supabase)

Payment receipts come from **Stripe**, not these templates. Brand them at
Stripe Dashboard → Settings → Branding (logo, brand `#16a34a` accent), and
enable receipts under Settings → Emails.
