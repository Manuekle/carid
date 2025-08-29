import type { NextAuthOptions, User, DefaultSession, RequestInternal } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import type { DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// Extend session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      isApproved: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    isApproved: boolean;
  }
}

// Extend JWT type
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    isApproved: boolean;
  }
}

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Helper functions
async function logAuthAttempt(email: string, success: boolean, req: any) {
  try {
    const headers = req?.headers || {};
    const ipAddress = Array.isArray(headers['x-forwarded-for'])
      ? headers['x-forwarded-for'][0]
      : headers['x-forwarded-for']?.split(',')[0]?.trim() || '';

    const userAgent = headers['user-agent'] || '';

    await (prisma as any).authLog.create({
      data: {
        email,
        success,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
}

async function checkLoginAttempts(email: string) {
  const attempt = await (prisma as any).loginAttempt.findUnique({
    where: { email },
  });

  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    throw new Error('TOO_MANY_ATTEMPTS');
  }

  return attempt;
}

async function incrementLoginAttempts(email: string) {
  await (prisma as any).loginAttempt.upsert({
    where: { email },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
      lockedUntil: {
        set: new Date(Date.now() + LOCKOUT_DURATION),
      },
    },
    create: {
      email,
      attempts: 1,
      lastAttempt: new Date(),
      lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
    },
  });
}

async function resetLoginAttempts(email: string) {
  await (prisma as any).loginAttempt.deleteMany({
    where: { email },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Se requieren correo electrónico y contraseña');
        }

        try {
          // Check for existing login attempts
          await checkLoginAttempts(credentials.email);

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              isApproved: true,
            },
          });

          if (!user) {
            await incrementLoginAttempts(credentials.email);
            if (req) await logAuthAttempt(credentials.email, false, req);
            throw new Error('Credenciales inválidas');
          }

          if (!user.password) {
            await incrementLoginAttempts(credentials.email);
            if (req) await logAuthAttempt(credentials.email, false, req);
            throw new Error('Credenciales inválidas');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            await incrementLoginAttempts(credentials.email);
            if (req) await logAuthAttempt(credentials.email, false, req);
            throw new Error('Credenciales inválidas');
          }

          // Check if mechanic is approved
          if (user.role === UserRole.MECHANIC && !user.isApproved) {
            throw new Error('PENDING_APPROVAL');
          }

          // Reset login attempts on successful login
          await resetLoginAttempts(credentials.email);
          if (req) await logAuthAttempt(credentials.email, true, req);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isApproved: user.isApproved,
          } as User;
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isApproved = user.isApproved;
      }

      // Update session with updated user data
      if (trigger === 'update' && session?.user) {
        token.role = session.user.role;
        token.isApproved = session.user.isApproved;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isApproved = token.isApproved;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permite redirects relativos o a la misma URL base
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Permite redirects a la URL base
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signOut() {
      // Invalidate session in database
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await (prisma as any).session.deleteMany({
          where: { userId: session.user.id },
        });
      }
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
};

// Helper to get session in API routes
export const getAuthSession = async (req: NextApiRequest, res: NextApiResponse) => {
  return await getServerSession(req, res, authOptions);
};
