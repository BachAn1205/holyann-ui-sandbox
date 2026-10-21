interface EmailNotificationInput {
  toEmail: string;
  toName: string;
  senderName: string;
  roomName: string;
  messagePreview: string;
  roomId: string;
}

export async function sendChatNotificationEmail(input: EmailNotificationInput) {
  if (process.env.MOCK_EXTERNAL_APIS === 'true') {
    console.log('[Mock Chat Email] Skipped sending chat notification email to:', input.toEmail)
    return { success: true };
  }
  const { toEmail, toName, senderName, roomName, messagePreview, roomId } = input;

  try {
    // TODO: Implement email sending với Resend hoặc Nodemailer
    // Đây là template cơ bản

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 Tin nhắn mới từ ${senderName}</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${toName}</strong>,</p>
            <p>Bạn có tin nhắn mới trong phòng <strong>${roomName}</strong>:</p>
            
            <div class="message-box">
              <p><strong>${senderName}:</strong></p>
              <p>${messagePreview}</p>
            </div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.holyannexplore.com'}/chat/${roomId}" class="button">
              Xem tin nhắn
            </a>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              💡 Bạn nhận được email này vì đã không đọc tin nhắn trong 15 phút gần đây.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 HolyAnn AI - Nền tảng tư vấn du học thông minh</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Option 1: Sử dụng Resend (Recommended) - optional dependency
    if (process.env.RESEND_API_KEY) {
      // @ts-ignore - optional: install "resend" when using RESEND_API_KEY
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'HolyAnn AI <noreply@holyann.ai>',
        to: toEmail,
        subject: `💬 ${senderName} đã gửi tin nhắn cho bạn`,
        html: emailHTML,
      });

      return { success: true };
    }

    // Option 2: Sử dụng Nodemailer (Fallback) - optional dependency
    if (process.env.SMTP_HOST) {
      // @ts-ignore - optional: install "nodemailer" when using SMTP_* env
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"HolyAnn AI" <noreply@holyann.ai>',
        to: toEmail,
        subject: `💬 ${senderName} đã gửi tin nhắn cho bạn`,
        html: emailHTML,
      });

      return { success: true };
    }

    console.warn('No email service configured. Skipping email notification.');
    return { success: false, error: 'No email service configured' };

  } catch (error: any) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}
