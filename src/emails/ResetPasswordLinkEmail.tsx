import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

export type ResetPasswordLinkEmailProps = {
  name?: string | null
  resetLink: string
  expiresHours?: number
}

export function ResetPasswordLinkEmail({
  name,
  resetLink,
  expiresHours = 1,
}: ResetPasswordLinkEmailProps) {
  return (
    <EmailLayout
      previewText="Link đặt lại mật khẩu Holyann Explore"
      brandName="Holyann Explore"
    >
      <Text style={styles.h2}>Đặt lại mật khẩu</Text>
      <Text style={styles.p}>
        Xin chào <strong>{name || 'bạn'}</strong>,
      </Text>
      <Text style={styles.p}>
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào
        nút bên dưới để tiếp tục:
      </Text>

      <Section style={styles.center}>
        <Button href={resetLink} style={styles.button}>
          Đặt lại mật khẩu
        </Button>
      </Section>

      <Section style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⏰ <strong>Link này sẽ hết hiệu lực sau {expiresHours} giờ.</strong>
          <br />
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </Text>
      </Section>

      <Text style={styles.small}>
        Nếu nút không hoạt động, hãy copy link sau vào trình duyệt:
        <br />
        <a href={resetLink} style={styles.link}>
          {resetLink}
        </a>
      </Text>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  h2: {
    color: '#1e293b',
    margin: '0 0 12px',
    fontSize: '18px',
    fontWeight: 700,
  },
  p: {
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 12px',
    fontSize: '14px',
  },
  center: {
    textAlign: 'center',
    margin: '22px 0',
  },
  button: {
    display: 'inline-block',
    background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    padding: '12px 16px',
    borderRadius: '0 6px 6px 0',
    marginTop: '18px',
  },
  warningText: {
    color: '#92400e',
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.5',
  },
  small: {
    color: '#64748b',
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '18px 0 0',
  },
  link: {
    color: '#2563eb',
    wordBreak: 'break-all',
  },
}

