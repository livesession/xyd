import { verifyToken, extractTokenFromCookie } from "~/lib/jwt";
import { organizationModel } from "~/models/organization";
import { userModel } from "~/models/user";
import { githubService } from "~/services/github";

async function getCurrentUser(request: Request) {
  const token = extractTokenFromCookie(request.headers.get('Cookie'));
  if (!token) {
    throw new Error('No token provided');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }

  return await userModel.findByEmail(payload.email);
}

export async function loader({ request }: { request: Request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const orgLogin = url.searchParams.get('orgLogin');

    if (!organizationId || !orgLogin) {
      return new Response('Organization ID and GitHub org login are required', { status: 400 });
    }

    // Verify organization belongs to user
      const organization = await organizationModel.findById(organizationId);
    if (!organization || !organization.users.map(user => user.toString()).includes(user._id!.toString())) {
      return new Response('Organization not found', { status: 404 });
    }

    if (!organization.githubToken) {
      return new Response('GitHub not connected', { status: 400 });
    }

    // Fetch repositories for the GitHub organization
    const repositories = await githubService.getOrganizationRepositories(organization.githubToken, orgLogin);

    return new Response(JSON.stringify(repositories), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
