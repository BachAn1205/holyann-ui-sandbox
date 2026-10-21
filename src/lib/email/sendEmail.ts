import { Resend } from 'resend'
import type * as React from 'react'

export type SendEmailInput = {
  to: string
  subject: string
  react?: React.ReactElement
  html?: string   // ← raw HTML bypass (for VML templates)
  from?: string
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM || 'Holyann Explore <technology@holyannexplore.com>'

export async function sendEmail(input: SendEmailInput) {
  if (process.env.MOCK_EXTERNAL_APIS === 'true') {
    console.log('[Mock Email] Skipped sending email to:', input.to)
    return { success: true as const }
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[Email] Missing RESEND_API_KEY — email not configured')
    return { success: false as const, error: 'EMAIL_NOT_CONFIGURED' as const }
  }

  const resend = new Resend(apiKey)

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: input.from || DEFAULT_FROM,
      to: [input.to],
      subject: input.subject,
      ...(input.react ? { react: input.react } : { html: input.html ?? '' }),
    }

    const { error } = await resend.emails.send(payload)

    if (error) {
      console.error('[Email] Resend error:', error)
      return { success: false as const, error: 'SMTP_SEND_FAILED' as const }
    }
  } catch (err) {
    console.error('[Email] sendEmail failed:', err)
    return { success: false as const, error: 'SMTP_SEND_FAILED' as const }
  }

  return { success: true as const }
}

