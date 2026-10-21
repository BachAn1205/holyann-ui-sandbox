import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ONLY ALLOW IN TEST MODE
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const { action, email, attempts, setExpired } = await request.json();

    if (action === 'cleanup') {
      if (email) {
        await prisma.users.deleteMany({ where: { email } });
        await prisma.otp_tokens.deleteMany({ where: { email } });
        return NextResponse.json({ success: true, message: `Cleaned up ${email}` });
      }
      return NextResponse.json({ error: 'Email required for cleanup' }, { status: 400 });
    }

    if (action === 'get-otp') {
      const otpRecord = await prisma.otp_tokens.findUnique({ where: { email } });
      if (!otpRecord) return NextResponse.json({ error: 'No OTP found' }, { status: 404 });
      
      // Allow modifying for testing purposes (like setting expired or brute force attempts)
      if (attempts !== undefined || setExpired) {
        await prisma.otp_tokens.update({
          where: { email },
          data: {
            attempts: attempts !== undefined ? attempts : otpRecord.attempts,
            expires_at: setExpired ? new Date(Date.now() - 60000) : otpRecord.expires_at
          }
        });
      }

      return NextResponse.json({ otp: otpRecord.otp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Testing API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
