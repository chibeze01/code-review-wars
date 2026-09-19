import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav, SiteFooter, WRAP } from '@/components/SiteChrome'
import { SITE, PRODUCT_FACTS, formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'Plain-English terms for Code Review Wars: how credits work (never expire, no subscription), the refund position, acceptable use, AI grading disclaimer and liability.',
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

export default function TermsPage() {
  return (
    <div className="bg-cream text-ink min-h-screen">
      <SiteNav />

      <main className={`${WRAP} py-14`}>
        <article className="max-w-3xl mx-auto">
          <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">legal</div>
          <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3">
            Terms of service
          </h1>
          <p className="text-[13.5px] text-ink-3 mt-3">Last reviewed {formatDate(SITE.lastReviewed)}</p>

          <P>
            These terms govern your use of {SITE.name} at {SITE.url.replace('https://', '')}. By creating an
            account or buying credits you agree to them. They are deliberately short; if something is unclear,
            email <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-ink">{SITE.contactEmail}</a>.
          </P>

          <H2>1. Who you are dealing with</H2>
          <P>
            {SITE.name} is operated by {SITE.tradingName}, {SITE.tradingAddress}. Contact:{' '}
            <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-ink">{SITE.contactEmail}</a>.
          </P>

          <H2>2. What the service is</H2>
          <P>
            {SITE.name} is an interview-practice tool. It generates realistic code with intentional flaws, lets
            you review it with inline comments, and grades the review using an AI model. It is not affiliated
            with any employer, and completing sessions does not guarantee any interview or hiring outcome.
          </P>

          <H2>3. Your account</H2>
          <UL items={[
            'You need a valid email address. Keep your password secure; you are responsible for activity on your account.',
            'One account per person. Do not share accounts or transfer credits between them.',
            'You must be at least 13 years old to use the service.',
          ]} />

          <H2>4. Credits and payment</H2>
          <UL items={[
            `Every new account receives ${PRODUCT_FACTS.freeCredits} free credits. No card is required to use them.`,
            'One credit starts one session (challenge generation plus AI grading). The credit is deducted when the session starts, not when it is graded, so an unfinished session can be resumed without a second charge.',
            'If a session fails to start on our side after the credit was taken, the credit is refunded to your balance automatically.',
            'Credit packs are one-time purchases priced in US dollars, shown at checkout and processed by Stripe. There is no subscription and nothing renews.',
            <>Credits never expire. Prices shown as &ldquo;launch price&rdquo; are valid until {formatDate(SITE.launchPriceEnds)}; credits bought at any price keep their full value afterwards.</>,
            'We may change pack prices for future purchases at any time. Changes never affect credits you already hold.',
          ]} />

          <H2>5. Refunds and cancellation</H2>
          <P>
            Credits are digital content made available to you immediately on purchase. By buying a pack you
            request that we supply the credits straight away and acknowledge that, once supplied, you lose the
            14-day right to cancel under the Consumer Contracts Regulations 2013.
          </P>
          <P>
            <b>Purchased credits are non-refundable.</b> The free credits on every account exist so you can judge
            the service before paying. This does not affect your statutory rights: if the service is faulty or
            not as described, contact us and we will put it right, which may include a refund.
          </P>

          <H2>6. Acceptable use</H2>
          <UL items={[
            'Do not attempt to access other users’ data, probe or overload the service, or interfere with grading.',
            'Do not scrape, bulk-download or resell generated challenges or grading output.',
            'Do not use automated tools to submit reviews or farm honor and rank.',
          ]} />
          <P>We may suspend or close accounts that breach these rules. Unused credits on an account closed for breach are forfeited.</P>

          <H2>7. Content and intellectual property</H2>
          <UL items={[
            'Challenge code, planted issues, grading output and model answers are generated by an AI model and provided for practice. You may use them for your own preparation; you may not republish them as a product.',
            'Your review comments and notes are yours. You grant us a licence to store and process them to operate the service (including sending them to our AI provider for grading, as described in the privacy policy).',
            `The ${SITE.name} name, design and site are ours.`,
          ]} />

          <H2>8. AI grading</H2>
          <P>
            Grades, feedback and model answers are produced by an AI model. They are useful and usually right,
            but they can be wrong, and they are not professional advice. Treat a disputed grade as a prompt to
            think, not a verdict. We do not manually re-grade sessions.
          </P>

          <H2>9. Availability and changes</H2>
          <P>
            We aim to keep the service available but do not guarantee it. We may change features, languages,
            domains or the grading model, and may withdraw the service with reasonable notice. If we withdraw it
            permanently, we will refund the purchase price of any unused credits.
          </P>

          <H2>10. Liability</H2>
          <P>
            Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud,
            or for anything else that cannot be limited by law. Subject to that, we are not liable for indirect
            or consequential loss, and our total liability to you in any twelve-month period is limited to the
            amount you paid us in that period.
          </P>

          <H2>11. Ending your account</H2>
          <P>
            You can delete your account at any time by emailing us from the address on the account. Deletion
            removes your sessions and forfeits any remaining credits, so use them first.
          </P>

          <H2>12. Law</H2>
          <P>
            These terms are governed by the law of England and Wales and disputes go to its courts. If you live
            elsewhere in the UK or in the EU, you also keep the protection of any mandatory consumer law where
            you live.
          </P>

          <H2>13. Changes to these terms</H2>
          <P>
            We will update the date at the top when these terms change and email account holders about anything
            material. See also our <Link href="/privacy" className="underline hover:text-ink">privacy policy</Link>.
          </P>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
