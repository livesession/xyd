import { redirect } from "react-router";
import { githubService } from "~/services/github";

export async function loader({ request }: { request: Request }) {
  try {
    // Get the GitHub OAuth URL
    const oauthUrl = githubService.getOAuthUrl();
    
    // Redirect to GitHub OAuth
    return redirect(oauthUrl);
  } catch (error) {
    console.error('Error initiating GitHub OAuth:', error);
    return redirect('/app/settings/git-settings?error=oauth_init_failed');
  }
}
