import { verifyToken, extractTokenFromCookie } from "~/lib/jwt";
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

export async function action({ request }: { request: Request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const organizationId = formData.get('organizationId') as string;
    const repoOrg = formData.get('repoOrg') as string;
    const repo = formData.get('repo') as string;
    const repoBranch = formData.get('repoBranch') as string;

    if (!organizationId) {
      return new Response('Organization ID is required', { status: 400 });
    }

    // Verify organization belongs to user
    const organization = await organizationModel.findById(organizationId);
    if (!organization || !organization.users.map(user => user.toString()).includes(user._id!.toString())) {
      return new Response('Organization not found', { status: 404 });
    }

    // Update organization with GitHub settings
    const updatedOrg = await organizationModel.update(organizationId, {
      githubSettings: {
        repoOrg: repoOrg || undefined,
        repo: repo || undefined,
        repoBranch: repoBranch || undefined,
      }
    });

    if (!updatedOrg) {
      return new Response('Failed to update organization', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error saving GitHub settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
