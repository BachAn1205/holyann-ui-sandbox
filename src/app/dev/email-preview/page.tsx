import { render } from '@react-email/render'
import { ResetPasswordOtpEmail } from '@/emails/ResetPasswordOtpEmail'
import { generateMeetingEmailHtml } from '@/emails/MeetingEmail'

export const dynamic = 'force-dynamic'

export default async function EmailPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h2>Email preview</h2>
        <p>Not available in production.</p>
      </div>
    )
  }

  const otpHtml = await render(
    <ResetPasswordOtpEmail name="Nguyễn Văn A" otp="123456" expiresMinutes={10} />
  )

  // Use generateMeetingEmailHtml directly — bypasses React Email render
  // so the full VML + Table-based HTML is previewed as-is
  const meetingHtml = generateMeetingEmailHtml({
    variant: 'invite',
    title: 'Tư vấn 1-1',
    description: 'Trao đổi kế hoạch ứng tuyển và tiến độ.',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    meetLink: 'https://example.com/meet',
    mentorName: 'Mentor Demo',
    studentName: '{tên học viên}',
    brandName: 'Holyann Explore',
  })

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Email preview (dev only)</h2>
      <p>
        Đây là trang preview template React Email. Các block dưới đây hiển thị HTML email trong iframe.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Reset password OTP</h3>
        <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 500 }}>
          ResetPasswordOtpEmail
        </span>
      </div>
      <iframe
        title="otp"
        style={{ width: '100%', height: 520, border: 'none', display: 'block' }}
        srcDoc={otpHtml}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '32px 0 8px' }}>
        <h3 style={{ margin: 0 }}>Meeting invite</h3>
        <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 500 }}>
          MeetingEmail (VML Table-based)
        </span>
      </div>
      <iframe
        title="meeting"
        style={{ width: '100%', height: 720, border: 'none', display: 'block' }}
        srcDoc={meetingHtml}
      />
    </div>
  )
}
