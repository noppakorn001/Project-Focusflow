import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  // CSRF protection: validate state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json(
      { error: 'Invalid state parameter — possible CSRF attack' },
      { status: 403 }
    );
  }

  // Clean up state cookie after validation
  cookieStore.delete('oauth_state');

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in HTTP-only cookies with hardened settings
    if (tokens.access_token) {
      cookieStore.set('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600, // 1 hour
      });
    }

    if (tokens.refresh_token) {
      cookieStore.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Use specific origin instead of wildcard for postMessage security
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '${appUrl}');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
