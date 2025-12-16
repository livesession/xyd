import { redirect } from "react-router";

import { verifyToken, extractTokenFromCookie } from "~/lib/jwt";
import { organizationModel } from "~/models/organization";
import { userModel } from "~/models/user";
import { githubService } from "~/services/github";

export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return redirect(`/app/settings/git-settings?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return redirect('/app/settings/git-settings?error=missing_code');
    }

    try {
        // Verify user is authenticated
        const token = extractTokenFromCookie(request.headers.get('Cookie'));
        if (!token) {
            return redirect('/signin');
        }

        const payload = verifyToken(token);
        if (!payload) {
            return redirect('/signin');
        }

        const user = await userModel.findByEmail(payload.email);
        if (!user) {
            return redirect('/signin');
        }

        // Get the user's first organization (assuming they have at least one)
        const userOrganizations = await organizationModel.findByUser(user._id!);

        if (userOrganizations.length === 0) {
            return redirect('/app/settings/git-settings?error=no_organizations');
        }

        // TODO: in the future multiple orgnizations
        const organization = userOrganizations[0]; // Use first organization

        // Exchange code for access token
        const accessToken = await githubService.exchangeCodeForToken(code);

        // Update organization with GitHub token
        await organizationModel.update(organization._id!, {
            githubToken: accessToken,
        });

        // Redirect back to git settings with success
        return redirect('/app/settings/git-settings?success=github_connected');

    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        return redirect('/app/settings/git-settings?error=callback_failed');
    }
}
