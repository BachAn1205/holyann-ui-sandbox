import * as React from 'react'
import { EMAIL_ASSETS } from '@/lib/email/assets'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
  Link,
} from '@react-email/components'

export type EmailLayoutProps = {
  previewText?: string
  brandName?: string
  tagline?: string
  children: React.ReactNode
  logoUrl?: string
  heroUrl?: string
  contactUrl?: string
}

const DEFAULT_LOGO_URL = EMAIL_ASSETS.resetPass.logo
const DEFAULT_HERO_URL = EMAIL_ASSETS.resetPass.background

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://www.holyannexplore.com'

export function EmailLayout({
  previewText,
  brandName = 'Holyann Explore',
  tagline,
  children,
  logoUrl = DEFAULT_LOGO_URL,
  heroUrl = DEFAULT_HERO_URL,
  contactUrl,
}: EmailLayoutProps) {
  const mailFingerprint = `${brandName}-${new Date().toISOString()}`
  const resolvedContactUrl = contactUrl || `${baseUrl}/contact`

  return (
    <Html lang="vi">
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section
            style={{
              ...styles.heroSection,
              backgroundImage: `url('${heroUrl}')`,
            }}
          >
            <Section style={styles.header}>
              <Img src={logoUrl} width="120" alt={brandName} style={styles.logo} />
            </Section>

            <Section style={styles.content}>{children}</Section>
          </Section>

          {tagline ? (
            <Section style={styles.taglineWrap}>
              <Text style={styles.taglineText}>{tagline}</Text>
            </Section>
          ) : null}

          {/* Footer */}
          <Section style={styles.footerMain}>
            <Text style={styles.footerTextBold}>
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </Text>
          </Section>

          <Section style={styles.footerLinks}>
            <Text style={styles.footerLinksText}>
              <Link href={`${baseUrl}/settings`} style={styles.link}>Unsubscribe</Link>
              {'  '}|{'  '}
              <Link href={baseUrl} style={styles.link}>View in browser</Link>
            </Text>
          </Section>

          <Section style={styles.footerAntiTrim}>
            <Text style={styles.footerAntiTrimText}>ref: {mailFingerprint}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: '20px 0',
    backgroundColor: '#f3f4f6',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    width: '800px',
    maxWidth: '100%',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  },
  heroSection: {
    width: '100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center',
    backgroundSize: '100% auto',
    backgroundColor: '#dbeafe',
  },
  header: {
    padding: '24px 24px 12px',
    textAlign: 'center',
    width: '100%',
  },
  logo: {
    margin: '0 auto',
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
  },
  content: {
    padding: '0 32px 24px',
    textAlign: 'center',
    width: '100%',
  },
  taglineWrap: {
    padding: '0 24px 12px',
    textAlign: 'center',
  },
  taglineText: {
    color: '#64748b',
    fontSize: '12px',
    margin: 0,
    lineHeight: '1.5',
  },
  footerMain: {
    backgroundColor: '#eaf4ff',
    padding: '16px 24px',
    textAlign: 'center',
    margin: 0,
  },
  footerTextBold: {
    color: '#0f4a8a',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: 0,
  },
  footerLinks: {
    backgroundColor: '#ffffff',
    padding: '14px 24px 16px',
    textAlign: 'center',
    margin: 0,
  },
  footerLinksText: {
    color: '#6b7280',
    fontSize: '12px',
    margin: 0,
  },
  footerAntiTrim: {
    backgroundColor: '#ffffff',
    padding: '0 24px 6px',
    textAlign: 'center',
    margin: 0,
  },
  footerAntiTrimText: {
    color: '#ffffff',
    fontSize: '1px',
    lineHeight: '1px',
    margin: 0,
  },
  link: {
    color: '#6b7280',
    textDecoration: 'underline',
  },
}