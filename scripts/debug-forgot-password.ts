import * as dotenv from 'dotenv'
import { prisma } from '@/lib/prisma'
import { sendResetCode } from '@/actions/auth-reset'

dotenv.config()

async function run() {
  const identifier = process.argv[2]?.trim().toLowerCase()

  if (!identifier) {
    console.error('Usage: npx tsx scripts/debug-forgot-password.ts <email-or-phone>')
    process.exit(1)
  }

  console.log('[Debug] Identifier:', identifier)

  const user = await prisma.users.findFirst({
    where: {
      OR: [{ email: identifier }, { phone_number: identifier }],
    },
    select: {
      id: true,
      email: true,
      phone_number: true,
      full_name: true,
      role: true,
    },
  })

  if (!user) {
    console.log('[Debug] User: NOT_FOUND')
    return
  }

  console.log('[Debug] User:', {
    id: user.id,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
  })

  const result = await sendResetCode(identifier)
  console.log('[Debug] sendResetCode result:', result)

  // Show newest OTP row for quick verification (no OTP value leakage in production use)
  const otpRows = await prisma.$queryRawUnsafe<Array<{ email: string; expires_at: Date; created_at: Date }>>(
    `SELECT email, expires_at, created_at
     FROM password_reset_otps
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    identifier,
  )

  if (otpRows.length === 0) {
    console.log('[Debug] OTP row: NOT_FOUND')
    return
  }

  console.log('[Debug] OTP row:', otpRows[0])
}

run().catch((error) => {
  console.error('[Debug] Failed:', error)
  process.exit(1)
})
