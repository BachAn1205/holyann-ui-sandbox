import * as React from 'react'
import { Text, Section, Button, Link } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

export type WelcomeEmailProps = {
  studentName?: string
  loginEmail?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://www.holyannexplore.com'

export function WelcomeEmail({ studentName, loginEmail }: WelcomeEmailProps) {
  return (
    <EmailLayout previewText="Chúc mừng học viên đã gia nhập Holyann Explore!">
      
      {/* Lời chào */}
      <Section style={{ marginBottom: '16px' }}>
        <Text style={styles.title}>
          Chúc mừng học viên đã gia nhập gia đình
          <br />
          Holyann Explore!
        </Text>
        <Text style={styles.greeting}>
          Xin chào <span style={{ color: '#ea580c' }}>{studentName ? studentName : 'Tên học viên'}</span>
        </Text>
        <Text style={styles.text}>
          Bạn có thể đăng nhập và bắt đầu khám phá lộ trình của riêng bạn ngay bây giờ!
        </Text>
      </Section>

      {/* Box thông tin */}
      <Section style={styles.infoBox}>
        <Text style={styles.infoText}>
          <strong style={styles.label}>Email đăng nhập:</strong>{' '}
          <Link href={`mailto:${loginEmail || 'support@holyann.com'}`} style={styles.infoLink}>
            {loginEmail || '[Email của bạn]'}
          </Link>
        </Text>
        <Text style={styles.infoText}>
          <strong style={styles.label}>Trạng thái:</strong> Đã kích hoạt
        </Text>
      </Section>

      {/* Nút đăng nhập */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Button href={`${baseUrl}/student/dashboard`} style={styles.button}>
          ĐĂNG NHẬP NGAY
        </Button>
      </Section>

      {/* Contact Support */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Text style={styles.supportText}>
          Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.
        </Text>
        <Button href="https://www.facebook.com/holyannxplore" style={styles.outlineButton}>
          Liên hệ ➔
        </Button>
      </Section>

      {/* Lời kết */}
      <Section>
        <Text style={styles.closing}>
          Thân mến,
          <br />
          Đội ngũ Holyann Explore
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    color: '#0a427f',
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '8px',
    lineHeight: '1.4',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  greeting: {
    color: '#0a427f',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center',
    margin: '0 0 16px 0',
  },
  text: {
    color: '#4b5563',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#dcefff', // Màu xanh nhạt chuẩn hình
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  infoText: {
    color: '#0a427f',
    fontSize: '14px',
    margin: '6px 0',
    textAlign: 'center',
  },
  infoLink: {
    color: '#0a427f',
    textDecoration: 'none',
  },
  label: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0a427f',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block', // Cực kỳ quan trọng để nút không bị full width
    padding: '14px 40px',
  },
  supportText: {
    color: '#0a427f',
    fontSize: '14px',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: '#ffffff',
    border: '2px solid #0a427f',
    borderRadius: '4px',
    color: '#0a427f',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 32px',
  },
  closing: {
    color: '#0a427f',
    fontSize: '15px',
    fontStyle: 'italic',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0',
  },
}