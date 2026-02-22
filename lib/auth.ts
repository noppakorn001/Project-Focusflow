import { google } from 'googleapis';
import { cookies } from 'next/headers';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.events',
];

export const getOAuth2Client = () => {
  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

export const getAuthenticatedClient = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Check if token needs refresh
  if (!accessToken && refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      cookieStore.set('access_token', credentials.access_token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
      });
      // Update client with new token
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  return oauth2Client;
};
