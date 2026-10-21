import * as React from 'react'
import { Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

export type ResetPasswordOtpEmailProps = {
  name?: string | null
  otp: string
  expiresMinutes?: number
}

export function ResetPasswordOtpEmail({
  name,
  otp,
  expiresMinutes = 10,
}: ResetPasswordOtpEmailProps) {
  return (
    <EmailLayout
      previewText={`Mã xác nhận đặt lại mật khẩu: ${otp}`}
      brandName="Holyann Explore"
    >
      <Text style={styles.h2}>Đặt lại mật khẩu</Text>
      <Text style={styles.p}>
        Xin chào <strong>{name || 'bạn'}</strong>,
      </Text>
      <Text style={styles.p}>
        Sử dụng mã xác nhận bên dưới để đặt lại mật khẩu tài khoản của bạn:
      </Text>

      <Section style={styles.otpOuter}>
        <Text style={styles.otpLabel}>Mã xác nhận</Text>
        <Text style={styles.otpValue}>{otp}</Text>
      </Section>

      <Section style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⏰ <strong>Mã này có hiệu lực trong {expiresMinutes} phút.</strong>
          <br />
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </Text>
      </Section>
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
  otpOuter: {
    textAlign: 'center',
    margin: '22px 0',
    backgroundColor: '#f1f5f9',
    border: '2px dashed #2563eb',
    borderRadius: '12px',
    padding: '18px 24px',
  },
  otpLabel: {
    margin: '0 0 6px',
    fontSize: '12px',
    color: '#64748b',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  otpValue: {
    margin: 0,
    fontSize: '34px',
    fontWeight: 800,
    color: '#1e3a5f',
    letterSpacing: '8px',
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
}

