import { redirect } from "react-router";
import { OAuth2Client } from 'google-auth-library';

import { userModel } from '~/models/user';
import { organizationModel } from '~/models/organization';
import { generateToken } from '~/lib/jwt';
import { generateRandomOrganizationName } from '~/lib/organizationUtils';

import { getCallbackUrl } from './utils';

export async function loader({ request }: { request: Request }) {
    // Handle Google OAuth callback
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        // Handle OAuth error
        return redirect(`/signin?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return redirect('/signin?error=no_code');
    }

    try {
        // Create OAuth2 client
        const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            getCallbackUrl(request)
        );

        // Exchange code for tokens using SDK
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info using SDK
        const userInfoResponse = await oauth2Client.request({
            url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        });

        const googleUser = userInfoResponse.data as {
            id: string;
            email: string;
            name: string;
            picture?: string;
        };

        // Check if user already exists
        let user = await userModel.findByEmail(googleUser.email);
        let isNewUser = false;

        if (!user) {
            // Create new user
            user = await userModel.create({
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            });
            isNewUser = true;
        } else {
            // Update existing user info
            user = await userModel.update(user._id!, {
                name: googleUser.name,
                picture: googleUser.picture,
            });
        }

        // Check if user has valid organizations (organizations that actually exist)
        let hasValidOrganizations = false;
        if (user.organizations.length > 0) {
            // Verify that all organizations in the user's list actually exist
            const existingOrganizations = await organizationModel.findByUser(user._id!);
            hasValidOrganizations = existingOrganizations.length > 0;

            // If user has organization IDs but organizations don't exist, clean up the user's organizations array
            if (!hasValidOrganizations) {
                await userModel.update(user._id!, { organizations: [] });
                user.organizations = [];
            }
        }

        // If this is a new user or existing user has no valid organizations, create a default organization
        if (isNewUser || !hasValidOrganizations) {
            const defaultOrgName = generateRandomOrganizationName();
            const defaultOrganization = await organizationModel.create({
                name: defaultOrgName,
                description: 'Default organization',
                owner: user._id!,
            });

            // Add organization to user
            await userModel.addOrganization(user._id!, defaultOrganization._id!);
        }

        // Create JWT session token
        const sessionToken = generateToken({
            email: user.email,
        });

        // Redirect to app with session cookie
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/app/home',
                'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`
            }
        });

    } catch (error) {
        console.error('OAuth callback error:', error);
        return redirect('/signin?error=callback_failed');
    }
}
