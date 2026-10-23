import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthService } from '@/lib/services/auth.service'
import { authSecret } from '@/lib/auth/auth-secret'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ [NextAuth] Missing credentials');
          throw new Error('Email và mật khẩu không được để trống');
        }

        try {
          const result = await AuthService.login({
            email: credentials.email,
            password: credentials.password
          });

          if (!result.success || !result.user) {
            console.error('❌ [NextAuth] Login failed:', result.message);
            throw new Error(result.message || 'Đăng nhập thất bại');
          }

          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.full_name,
            role: result.user.role,
            image: result.user.avatar_url,
            accessToken: result.token,
            student: result.student || null
          };
        } catch (error: any) {
          console.error('❌ [NextAuth] Authorization error:', error);
          throw new Error(error.message || 'Đã xảy ra lỗi khi đăng nhập');
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth: tạo user + student trong DB (giống logic email/password)
      if (account?.provider === 'google' && user.email) {
        try {
          console.log('🔑 [NextAuth] Google signIn started for:', user.email);

          const result = await AuthService.oauthLogin(
            user.email,
            user.name || 'Google User',
            'GOOGLE',
            account.providerAccountId,
            user.image || undefined
          );

          console.log('🔑 [NextAuth] oauthLogin result:', {
            success: result.success,
            userId: result.user?.id,
            role: result.user?.role,
            hasStudent: !!result.student,
            message: result.message
          });

          if (!result.success || !result.user) {
            console.error('❌ [NextAuth] Google OAuth failed:', result.message);
            return `/login?error=OAuthFailed&message=${encodeURIComponent(result.message || 'Unknown error')}`;
          }

          // Gán DB user data vào user object → jwt callback sẽ nhận được
          user.id = result.user.id;
          user.role = result.user.role;
          user.student = result.student || null;
          // Lưu thêm dbUserId riêng phòng trường hợp id bị overwrite
          (user as any).dbUserId = result.user.id;

          return true;
        } catch (error) {
          console.error('❌ [NextAuth] Google signIn error:', error);
          return `/login?error=OAuthException`;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // First sign in
      if (user) {
        const dbId = (user as any).dbUserId || user.id;
        token.sub = dbId;
        token.role = user.role || 'STUDENT';
        token.student = user.student || undefined;
        token.name = user.name;

        if (account?.provider === 'google') {
          token.accessToken = account.access_token;
        } else if (user.accessToken) {
          token.accessToken = user.accessToken;
        }

        // Fetch fresh info from DB on login
        try {
          const dbUser = await prisma.users.findUnique({
            where: { id: dbId },
            select: {
              full_name: true,
              subscription_plan: true,
              role: true,
              mentors: {
                select: { specialization: true }
              }
            }
          });

          if (dbUser) {
            token.name = dbUser.full_name?.trim() || user.name;
            const raw = (dbUser.subscription_plan ?? 'FREE').toString().trim().toUpperCase();
            const plan = raw === 'ADVANCED' ? 'PREMIUM' : ['FREE', 'PLUS', 'PREMIUM'].includes(raw) ? raw : 'FREE';
            token.subscriptionPlan = plan as any;

            let finalRole = dbUser.role as string;
            if (dbUser.role === 'MENTOR' && dbUser.mentors?.specialization) {
              finalRole = dbUser.mentors.specialization;
            }
            token.role = finalRole;
          }
        } catch (e) {
          console.error('[NextAuth] Error fetching user info in jwt callback:', e);
          token.subscriptionPlan = 'FREE' as any;
        }
        token.subscriptionPlanUpdatedAt = Date.now();
      }

      // Refresh subscription plan occasionally (e.g. every 10 minutes)
      const now = Date.now();
      const last = typeof (token as any).subscriptionPlanUpdatedAt === 'number'
        ? (token as any).subscriptionPlanUpdatedAt
        : 0;
      const shouldRefresh = !(token as any).subscriptionPlan || now - last > 10 * 60 * 1000; // 10 minutes

      if (token.sub && shouldRefresh && !user) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { id: token.sub as string },
            select: {
              full_name: true,
              subscription_plan: true,
              role: true,
              mentors: {
                select: { specialization: true }
              }
            },
          });
          if (dbUser) {
            token.name = dbUser.full_name?.trim() || (token.name as string);
            const raw = (dbUser.subscription_plan ?? 'FREE').toString().trim().toUpperCase();
            const plan = raw === 'ADVANCED' ? 'PREMIUM' : ['FREE', 'PLUS', 'PREMIUM'].includes(raw) ? raw : 'FREE';
            token.subscriptionPlan = plan as any;

            let finalRole = dbUser.role as string;
            if (dbUser.role === 'MENTOR' && dbUser.mentors?.specialization) {
              finalRole = dbUser.mentors.specialization;
            }
            token.role = finalRole;
          }
        } catch (e) {
          console.error('[NextAuth] Error refreshing user info in jwt callback:', e);
        }
        token.subscriptionPlanUpdatedAt = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = token.role as string;
        (session.user as any).student = token.student;
        (session as any).accessToken = token.accessToken as string;
        session.user.name = token.name as string;
        (session.user as any).subscriptionPlan = (token as any).subscriptionPlan || 'FREE';
        (session.user as any).reportsUsed = 0;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  secret: authSecret,
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
}
