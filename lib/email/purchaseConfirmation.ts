// Hand-coded, table-based HTML email with inline CSS so it renders consistently
// across Gmail, Outlook/365 and Apple Mail (which ignore <style>, box-shadow, and
// web fonts). Brand approximated with the palette + a thick ink border.

export interface PurchaseEmailData {
  name?: string | null
  packName: string
  credits: number
  amountFormatted: string
  newBalance: number
  dashboardUrl: string
  logoUrl: string
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const INK = '#1c1917'
const INK2 = '#57534e'
const CREAM = '#fffaf0'
const CREAM2 = '#fff2dc'
const BRAND = '#16a34a'
const HI = '#ffd43b'

export function renderPurchaseEmail(data: PurchaseEmailData): {
  subject: string
  html: string
  text: string
} {
  const { packName, credits, amountFormatted, newBalance, dashboardUrl, logoUrl } = data
  const greeting = data.name ? `Hi ${esc(data.name.split(' ')[0])},` : 'Hi there,'
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const subject = `Your ${packName} — ${credits} credits added ⚔️`

  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${CREAM2};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK2};">${esc(label)}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${CREAM2};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};font-weight:${strong ? '700' : '600'};">${esc(value)}</td>
    </tr>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;">

        <!-- Logo + wordmark -->
        <tr>
          <td style="padding:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">
            <img src="${esc(logoUrl)}" width="44" height="44" alt="Code Review Wars" style="display:inline-block;vertical-align:middle;border-radius:10px;border:2px solid ${INK};">
            <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:800;color:${INK};">Code Review Wars</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#ffffff;border:2px solid ${INK};border-radius:14px;padding:28px;">

            <span style="display:inline-block;background-color:${BRAND};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">⚔️ Payment received</span>

            <h1 style="margin:18px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;color:${INK};font-weight:800;">You're topped up.</h1>
            <p style="margin:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK2};">${greeting} thanks for your purchase — your credits are ready to spend.</p>

            <!-- Order summary -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${row('Pack', packName)}
              ${row('Credits added', `+${credits}`)}
              ${row('Amount paid', amountFormatted)}
              ${row('Date', date)}
            </table>

            <!-- New balance -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px 0;">
              <tr>
                <td style="background-color:${HI};border:2px solid ${INK};border-radius:10px;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${INK};font-weight:700;" align="center">
                  You now have ${newBalance} credit${newBalance === 1 ? '' : 's'}.
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px 0;">
              <tr>
                <td bgcolor="${BRAND}" style="border:2px solid ${INK};border-radius:10px;">
                  <a href="${esc(dashboardUrl)}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Start training &rarr;</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 4px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a827b;">
            1 credit = one full practice session (AI-generated code + expert evaluation).<br>
            Questions? Just reply to this email. — Code Review Wars
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = [
    `${data.name ? `Hi ${data.name.split(' ')[0]},` : 'Hi there,'}`,
    ``,
    `Thanks for your purchase — your credits are ready to spend.`,
    ``,
    `Pack:          ${packName}`,
    `Credits added: +${credits}`,
    `Amount paid:   ${amountFormatted}`,
    `Date:          ${date}`,
    ``,
    `You now have ${newBalance} credit${newBalance === 1 ? '' : 's'}.`,
    ``,
    `Start training: ${dashboardUrl}`,
    ``,
    `1 credit = one full practice session (AI-generated code + expert evaluation).`,
    `Questions? Just reply to this email. — Code Review Wars`,
  ].join('\n')

  return { subject, html, text }
}
