import { NextResponse } from 'next/server';
import { getOAuth2Client, SCOPES } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function GET() {
  const oauth2Client = getOAuth2Client();

  // Generate cryptographically random state token for CSRF protection
  const state = randomBytes(32).toString('hex');

  // Store state in httpOnly cookie for validation in callback
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes — enough for OAuth flow
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });

  return NextResponse.json({ url: authUrl });
}
