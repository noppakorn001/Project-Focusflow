import { NextResponse } from 'next/server';
import { getOAuth2Client, SCOPES } from '@/lib/auth';

export async function GET() {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force refresh token
  });

  return NextResponse.json({ url: authUrl });
}
