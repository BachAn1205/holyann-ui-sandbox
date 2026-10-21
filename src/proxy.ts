import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PRICING_PATH = '/student/pricing'

function isProtectedStudentPage(pathname: string) {
  return (
    pathname === '/student/checklist' ||
    pathname.startsWith('/student/checklist/') ||
    pathname === '/student/deadlines' ||
    pathname.startsWith('/student/deadlines/') ||
    pathname === '/student/meeting' ||
    pathname.startsWith('/student/meeting/')
  )
}

function isProtectedApi(pathname: string) {
  if (
    pathname === '/api/checklist/complete-terms' ||
    pathname === '/api/checklist/initialize'
  ) {
    return false;
  }
  return (
    pathname === '/api/student/checklist' ||
    pathname.startsWith('/api/checklist/') ||
    pathname === '/api/checklist' ||
    pathname.startsWith('/api/students/me/deadlines/')
  )
}

function premiumBlockedApiResponse() {
  return NextResponse.json(
    {
      error: 'PREMIUM_REQUIRED',
      message: 'Tinh nang nay chi danh cho tai khoan Premium.',
    },
    { status: 402 }
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const protectPage = isProtectedStudentPage(pathname)
  const protectApi = isProtectedApi(pathname)
  if (!protectPage && !protectApi) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) return NextResponse.next()

  const role = (token as any).role as string | undefined
  if (role !== 'STUDENT') return NextResponse.next()

  const plan = (token as any).subscriptionPlan as string | undefined
  const isPremium = (plan ?? 'FREE') === 'PREMIUM'
  if (isPremium) return NextResponse.next()

  if (protectApi) return premiumBlockedApiResponse()

  const url = req.nextUrl.clone()
  url.pathname = PRICING_PATH
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/student/checklist/:path*',
    '/student/deadlines/:path*',
    '/student/meeting/:path*',
    '/api/student/checklist',
    '/api/checklist/:path*',
    '/api/students/me/deadlines/:path*',
  ],
}

