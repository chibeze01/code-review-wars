import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav, SiteFooter, WRAP } from '@/components/SiteChrome'
import { SITE, formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What Code Review Wars stores, which processors it uses (Supabase, Vercel, Stripe, Anthropic), how long data is kept, and your UK GDPR rights.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display font-extrabold text-[22px] mt-10 mb-3">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-ink-2 leading-[1.7] mb-3">{children}</p>
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 mb-3 pl-5 list-disc text-[15px] text-ink-2 leading-[1.7]">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div className="bg-cream text-ink min-h-screen">
      <SiteNav />

      <main className={`${WRAP} py-14`}>
        <article className="max-w-3xl mx-auto">
          <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">legal</div>
          <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3">
            Privacy policy
          </h1>
          <p className="text-[13.5px] text-ink-3 mt-3">Last reviewed {formatDate(SITE.lastReviewed)}</p>

          <P>
            This policy explains what {SITE.name} (&ldquo;we&rdquo;) collects when you use{' '}
            {SITE.url.replace('https://', '')}, why, who processes it, and what you can ask us to do with it. It
            is written to be read, not skimmed past.
          </P>

          <H2>Who we are</H2>
          <P>
            {SITE.name} is operated by {SITE.tradingName}, {SITE.tradingAddress}. We are the data controller for
            the personal data described here. Contact:{' '}
            <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-ink">{SITE.contactEmail}</a>.
          </P>

          <H2>What we store</H2>
          <UL items={[
            <><b>Account:</b> your email address and a hashed password, managed by Supabase Auth. We never see your plaintext password.</>,
            <><b>Credits and payments:</b> your credit balance and a ledger of purchases and usage, including the Stripe payment reference. Card details go directly to Stripe; we never receive or store them.</>,
            <><b>Review sessions:</b> the generated code you reviewed, your inline comments and general notes, the grading result (score, grade, feedback, model answer), the language and domain you picked, and how long the session took.</>,
            <><b>Custom domain prompts:</b> if you describe your own domain for a challenge, that text is stored with the session so it can be resumed.</>,
            <><b>Technical data:</b> our hosting provider keeps short-lived server logs (including IP address) for security and debugging. Analytics are cookieless page-view counts — no cross-site tracking, no user profiles.</>,
          ]} />

          <H2>Why we use it</H2>
          <UL items={[
            'To run the service: sign you in, generate challenges, grade your reviews, track your progress and rank.',
            'To process payments and keep the credit ledger accurate.',
            'To prevent abuse, keep the service secure, and understand aggregate usage.',
            'To reply when you contact us.',
          ]} />
          <P>
            Under UK GDPR our legal bases are: performance of our contract with you (account, credits, grading);
            our legitimate interests (security, abuse prevention, aggregate analytics); and legal obligation
            (keeping payment records).
          </P>

          <H2>Who processes it</H2>
          <P>We use a small number of third-party processors. Each only receives what it needs:</P>
          <UL items={[
            <><b>Supabase</b> — authentication and our Postgres database, hosted in AWS eu-west-1 (Ireland). Everything listed under &ldquo;what we store&rdquo; lives here.</>,
            <><b>Vercel</b> — hosting, server-side rendering, and cookieless Web Analytics / Speed Insights.</>,
            <><b>Stripe</b> — payment processing. Stripe is an independent controller for card data; see Stripe&apos;s own privacy policy.</>,
            <><b>{SITE.llmProvider.name}</b> — the AI model provider. To generate a challenge and to grade your review, we send the generated code, your inline comments and your general notes (and a custom domain prompt, if you wrote one) to {SITE.llmProvider.name}&apos;s API. Your email and account details are not sent. Under {SITE.llmProvider.name}&apos;s commercial API terms, inputs and outputs are not used to train their models. See their <a href={SITE.llmProvider.privacyUrl} className="underline hover:text-ink" target="_blank" rel="noopener noreferrer">privacy policy</a>.</>,
          ]} />
          <P>
            Stripe, Vercel and {SITE.llmProvider.name} process some data outside the UK, principally in the United
            States. Those transfers rely on the UK International Data Transfer Agreement / Addendum to the EU
            Standard Contractual Clauses, or an adequacy decision where one applies.
          </P>

          <H2>How long we keep it</H2>
          <UL items={[
            'Account, credit and session data: for as long as your account exists. Ask us to delete your account and it goes, along with your sessions.',
            'Payment records: as long as UK tax and accounting law requires (currently six years), even after account deletion.',
            'Server logs: short-lived, retained by the hosting provider for a matter of days to weeks.',
          ]} />

          <H2>Cookies</H2>
          <P>
            We set only the cookies needed to keep you signed in (Supabase session cookies). There are no
            advertising or tracking cookies, and our analytics do not use cookies, so there is no cookie banner.
          </P>

          <H2>Your rights</H2>
          <P>Under UK GDPR you can ask us to:</P>
          <UL items={[
            'Give you a copy of the personal data we hold about you (access).',
            'Correct anything inaccurate (rectification).',
            'Delete your account and data (erasure), subject to the payment-record retention above.',
            'Restrict or object to processing based on legitimate interests.',
            'Export your data in a machine-readable format (portability).',
          ]} />
          <P>
            Email <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-ink">{SITE.contactEmail}</a>{' '}
            from the address on your account and we will respond within one month. You also have the right to
            complain to the Information Commissioner&apos;s Office at{' '}
            <a href="https://ico.org.uk" className="underline hover:text-ink" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
          </P>

          <H2>Children</H2>
          <P>The service is not directed at children under 13 and we do not knowingly collect their data.</P>

          <H2>Changes</H2>
          <P>
            If this policy changes materially we will update the date at the top and, for anything that affects
            how your data is used, email account holders. See also our{' '}
            <Link href="/terms" className="underline hover:text-ink">terms of service</Link>.
          </P>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
