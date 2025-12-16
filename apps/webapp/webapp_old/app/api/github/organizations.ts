import { verifyToken, extractTokenFromCookie } from "~/lib/jwt";
import { githubService } from "~/services/github";
import { organizationModel } from "~/models/organization";
import { userModel } from "~/models/user";

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

    if (!organizationId) {
      return new Response('Organization ID is required', { status: 400 });
    }
    
    // Verify organization belongs to user
    const organization = await organizationModel.findById(organizationId);
    if (!organization || !organization.users.map(user => user.toString()).includes(user._id!.toString())) {
      return new Response('Organization not found', { status: 404 });
    }

    if (!organization.githubToken) {
      return new Response('GitHub not connected', { status: 400 });
    }

    // Fetch GitHub organizations
    const githubOrgs = await githubService.getUserOrganizations(organization.githubToken);

    return new Response(JSON.stringify(githubOrgs), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching GitHub organizations:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
