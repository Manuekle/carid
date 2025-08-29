import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Obtener sesión del servidor
    const session = await getServerSession(req, res, authOptions);

    // Obtener token JWT
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Info del environment
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    };

    // Headers importantes
    const headers = {
      host: req.headers.host,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'user-agent': req.headers['user-agent'],
      cookie: req.headers.cookie ? 'present' : 'not present',
    };

    return res.status(200).json({
      session,
      token: token
        ? {
            id: token.id,
            email: token.email,
            role: token.role,
            isApproved: token.isApproved,
          }
        : null,
      envInfo,
      headers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
