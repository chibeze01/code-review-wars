import { getTransport, getFromAddress } from './transport'
import { renderPurchaseEmail, type PurchaseEmailData } from './purchaseConfirmation'

interface SendArgs {
  to: string
  name?: string | null
  packName: string
  credits: number
  amountFormatted: string
  newBalance: number
}

/**
 * Best-effort purchase confirmation email. Never throws — the caller (the Stripe
 * webhook) must still return 200 after credits are granted, so a mail failure is
 * logged and swallowed rather than triggering a Stripe retry.
 */
export async function sendPurchaseConfirmation(args: SendArgs): Promise<boolean> {
  const transport = getTransport()
  if (!transport) {
    console.warn('[email] SMTP not configured — skipping purchase confirmation')
    return false
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://codereviewwars.dev'
  const data: PurchaseEmailData = {
    name: args.name,
    packName: args.packName,
    credits: args.credits,
    amountFormatted: args.amountFormatted,
    newBalance: args.newBalance,
    dashboardUrl: `${appUrl}/dashboard`,
    logoUrl: `${appUrl}/android-chrome-512x512.png`,
  }

  try {
    const { subject, html, text } = renderPurchaseEmail(data)
    await transport.sendMail({ from: getFromAddress(), to: args.to, subject, html, text })
    return true
  } catch (err) {
    console.error('[email] Failed to send purchase confirmation:', err)
    return false
  }
}
