import nodemailer from 'nodemailer'

export type EmailTransporter = ReturnType<typeof nodemailer.createTransport>

export function getEmailTransporter(): EmailTransporter | null {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const secure = (process.env.SMTP_SECURE || 'true') === 'true'

  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (!host || !user || !pass) {
    console.warn('[Email] Missing SMTP config — required: SMTP_HOST, SMTP_USER/EMAIL_USER, SMTP_PASS/EMAIL_PASS')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
  })
}

export function getDefaultFrom() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  return process.env.EMAIL_FROM || (user ? `"Holyann Explore" <${user}>` : 'Holyann Explore <noreply@localhost>')
}

