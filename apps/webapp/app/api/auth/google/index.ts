import { OAuth2Client } from 'google-auth-library';

import { getCallbackUrl } from './utils';

export async function action({ request }: { request: Request }) {
  try {
    const callbackUrl = getCallbackUrl(request);
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    // Redirect to Google OAuth
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    });
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

