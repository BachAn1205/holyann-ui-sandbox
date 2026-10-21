/**
 * MeetingEmail.tsx
 * ─────────────────────────────────────────────────────────────────────
 * - Bản Landscape Rộng (1000px) + Responsive Mobile.
 * - Cập nhật Background mới (back-noholie.png) cực nét.
 * - Xóa z-index của thẻ trắng, áp dụng DOM Order để Mascot (viết sau) 
 * tự động đè lên thẻ trắng 100% trên mọi ứng dụng Email (Gmail, Outlook).
 * ─────────────────────────────────────────────────────────────────────
 */

import * as React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { EMAIL_ASSETS } from '@/lib/email/assets'

export type MeetingEmailVariant = 'invite' | 'update' | 'cancel'

export type MeetingEmailProps = {
  variant?: MeetingEmailVariant
  title: string
  description?: string | null
  startTime: Date
  endTime?: Date | null
  meetLink?: string | null
  mentorName?: string | null
  studentName?: string
  brandName?: string
}

// ── Asset URLs (Background nét) ───────────────────────────────────────
const LOGO_URL = EMAIL_ASSETS.meeting.logo
const BG_URL = EMAIL_ASSETS.meeting.background
const MASCOT_URL = EMAIL_ASSETS.meeting.mascot

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.holyannexplore.com'

// ─────────────────────────────────────────────────────────────────────
// MAIN HTML GENERATOR
// ─────────────────────────────────────────────────────────────────────
export function generateMeetingEmailHtml(props: MeetingEmailProps): string {
  const {
    variant = 'invite',
    title,
    description,
    startTime,
    endTime,
    meetLink,
    mentorName = 'Cố vấn Holyann',
    studentName = '[Tên học viên]',
    brandName = 'Holyann Explore',
  } = props

  const isCancel = variant === 'cancel'
  const isUpdate = variant === 'update'

  const timeStart = format(new Date(startTime), "EEEE, dd/MM/yyyy 'lúc' HH:mm", { locale: vi })
  const timeEnd = endTime ? format(new Date(endTime), 'HH:mm', { locale: vi }) : null
  const timeStr = timeEnd ? `${timeStart} - ${timeEnd}` : timeStart

  const subject =
    variant === 'invite' ? `Thư mời tư vấn: ${title}`
      : variant === 'update' ? `Cập nhật lịch: ${title}`
        : `Hủy lịch tư vấn: ${title}`

  const strikeCss = 'text-decoration:line-through;color:#a0aec0;'

  const buttonHtml = meetLink && !isCancel ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 20px auto 0 auto;">
      <tr>
        <td align="center">
          <a href="${meetLink}" class="btn-text"
                 style="background-color:#fce041;border-radius:30px;color:#0f4c81;
                        display:inline-block;font-family:Arial,Helvetica,sans-serif;
                        font-size:16px;font-weight:bold;line-height:45px;
                        padding:0 35px;text-decoration:none;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        -webkit-text-size-adjust:none;">
                Tham gia phòng họp
              </a>
          </td>
      </tr>
    </table>
    <p class="link-text" style="margin:15px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#718096;text-align:center;">
      Hoặc sao chép đường link:&nbsp;
      <a href="${meetLink}" style="color:#0f4c81;text-decoration:underline;word-break:break-all;">
        ${meetLink}
      </a>
    </p>` : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${brandName} - ${subject}</title>
  <style type="text/css">
    body, table, td, p, a, li { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse !important; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    body { margin:0; padding:0; width:100% !important; min-width:100%; background-color:#e0f2fe; }

    /* --- RESPONSIVE MEDIA QUERIES --- */
    @media screen and (max-width: 850px) {
      .white-card { width: 90% !important; max-width: 90% !important; padding: 30px !important; }
      .mascot { width: 220px !important; }
      .mascot-wrapper { margin-top: -260px !important; }
    }
    @media screen and (max-width: 600px) {
      .main-container { padding: 15px 5px !important; }
      .white-card { width: 95% !important; max-width: 95% !important; padding: 25px 15px !important; }
      
      .mascot { width: 170px !important; }
      .mascot-wrapper { margin-top: -180px !important; }
      
      .title { font-size: 22px !important; }
      .subtitle { font-size: 18px !important; }
      .desc { font-size: 14px !important; }
      .content-text { font-size: 14px !important; }
      .btn-text { font-size: 14px !important; line-height: 40px !important; padding: 0 25px !important; }
      .link-text { font-size: 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e0f2fe;font-family:Arial,Helvetica,sans-serif;">

<div style="display:none;font-size:1px;color:#e0f2fe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${subject}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e0f2fe;">
  <tr>
    <td class="main-container" align="center" style="padding:30px 10px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="1000" style="width:100%;max-width:1000px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.15);">
        <tr>
          <td background="${BG_URL}" bgcolor="#1e3a8a" valign="top" style="background-image:url('${BG_URL}');background-size:100% 100%;background-position:center;background-repeat:no-repeat;">
            
            <div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:25px 20px 10px 20px;">
                    <img src="${LOGO_URL}" width="160" alt="${brandName}" style="display:block;height:auto;border:0;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:0 20px;">
                    <h1 class="title" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;color:#0f4c81;font-weight:bold;line-height:1.4;">
                      ${isUpdate ? 'Cập nhật buổi tư vấn' : isCancel ? 'Thông báo hủy lịch' : 'Thư mời tham gia buổi tư vấn'}
                    </h1>
                    <h2 class="subtitle" style="margin:5px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#0f4c81;font-weight:bold;line-height:1.4;">
                      Xin chào <span style="color:#e53935;">${studentName}</span>,
                    </h2>
                    <p class="desc" style="margin:8px 0 25px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f4c81;line-height:1.6;">
                      ${isUpdate ? 'Lịch tư vấn của bạn đã được cập nhật với thông tin như sau:' : isCancel ? 'Buổi tư vấn dưới đây đã được hủy bỏ:' : 'Mời bạn tham gia buổi tư vấn trực tuyến với thông tin như sau:'}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 20px 0 20px;">
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: -22px; position: relative; z-index: 20;">
                      <tr>
                        <td align="center" style="background-color:#fce041;border-radius:50%;width:48px;height:48px;text-align:center;vertical-align:middle;font-size:22px;box-shadow:0 4px 10px rgba(0,0,0,0.15);">
                          🔔
                        </td>
                      </tr>
                    </table>

                    <table class="white-card" role="presentation" cellpadding="0" cellspacing="0" border="0" width="800" align="center" style="width:100%;max-width:800px;background-color:#ffffff;border-radius:15px;border:1.5px solid #d0dff5;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
                      <tr>
                        <td style="padding:35px 35px 30px 35px;text-align:left;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="30" valign="top" style="font-size:17px;padding-bottom:12px;color:#0f4c81;">🕒</td>
                              <td class="content-text" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f4c81;padding-bottom:12px;line-height:1.6;">
                                <strong>Thời gian:</strong> <span style="${isCancel ? strikeCss : ''}">${timeStr}</span>
                              </td>
                            </tr>
                            <tr>
                              <td width="30" valign="top" style="font-size:17px;padding-bottom:12px;color:#0f4c81;">👤</td>
                              <td class="content-text" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f4c81;padding-bottom:12px;line-height:1.6;">
                                <strong>Cố vấn:</strong> ${mentorName}
                              </td>
                            </tr>
                            <tr>
                              <td width="30" valign="top" style="font-size:17px;color:#0f4c81;">💬</td>
                              <td class="content-text" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f4c81;line-height:1.6;">
                                <strong>Nội dung:</strong> <span style="${isCancel ? strikeCss : ''}">${title}${description ? ` – ${description}` : ''}</span>
                              </td>
                            </tr>
                          </table>
                          ${buttonHtml}
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="position: relative; z-index: 50;">
                      <tr>
                        <td align="right" style="padding-right: 40px; position: relative; z-index: 50;">
                          <div class="mascot-wrapper" style="margin-top: -320px; position: relative; z-index: 50;">
                            <img class="mascot" src="${MASCOT_URL}" width="280" alt="Mascot" style="display:block; border:0; outline:none; position: relative; z-index: 50;" />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td height="20" style="height: 20px; line-height: 20px; font-size: 20px;">&nbsp;</td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:0px 30px 25px 30px;">
                    <div style="border-top:1px solid rgba(255,255,255,0.3);width:80%;margin:0 auto;padding-top:15px;text-align:center;">
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;font-weight:bold;">
                        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
                      </p>
                      <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.8);">
                        <a href="${BASE_URL}/settings" style="color:rgba(255,255,255,0.8);text-decoration:underline;">Unsubscribe</a>
                        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                        <a href="${BASE_URL}" style="color:rgba(255,255,255,0.8);text-decoration:underline;">View in browser</a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

            </div>

            </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`
}

export function MeetingEmail(props: Partial<MeetingEmailProps> = {}) {
  const htmlContent = generateMeetingEmailHtml({
    title: props.title || 'Buổi tư vấn hồ sơ',
    startTime: props.startTime || new Date('2026-04-15T09:00:00'),
    endTime: props.endTime || new Date('2026-04-15T10:00:00'),
    meetLink: props.meetLink || 'https://holyannexplore.daily.co/UMeCdwDRnllthMKOXdRj',
    mentorName: props.mentorName || 'Holyann Explore',
    studentName: props.studentName || 'Bach An',
    description: props.description || 'Họp định kỳ',
    variant: props.variant || 'invite'
  })

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
}

export default MeetingEmail;