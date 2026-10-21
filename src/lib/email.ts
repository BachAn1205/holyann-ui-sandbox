import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.inet.vn',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to: string, otp: string) {
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Xác thực tài khoản của bạn</h2>
      <p style="color: #555; font-size: 16px;">Xin chào,</p>
      <p style="color: #555; font-size: 16px;">Mã OTP của bạn để hoàn tất việc đăng ký là:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; padding: 10px 20px; background-color: #f8f9fa; border-radius: 5px; border: 1px dashed #007bff;">${otp}</span>
      </div>
      <p style="color: #555; font-size: 16px;">Mã này có hiệu lực trong vòng 5 phút.</p>
      <p style="color: #dc3545; font-size: 14px; font-weight: bold;">CẢNH BÁO: Vui lòng KHÔNG chia sẻ mã này cho bất kỳ ai để bảo mật tài khoản.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Holyann Explore" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Mã xác thực OTP - Đăng ký tài khoản',
      html: htmlTemplate,
    });
    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email OTP');
  }
}
