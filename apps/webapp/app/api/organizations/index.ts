import { verifyToken, extractTokenFromCookie } from '~/lib/jwt';
import { organizationModel } from '~/models/organization';
import { userModel } from '~/models/user';

// Helper function to get user from JWT session
async function getCurrentUser(request: Request) {
  const token = extractTokenFromCookie(request.headers.get('Cookie'));
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return await userModel.findByEmail(payload.email);
}

export async function loader({ request }: { request: Request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get organizations where user is a member
    const organizations = await organizationModel.findByUser(user._id!);

    return new Response(JSON.stringify(organizations.map(org => ({
      id: org._id?.toString(),
      name: org.name,
      description: org.description,
      owner: org.owner.toString(),
      users: org.users.map(userId => userId.toString()),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }))), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error getting organizations:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
      return new Response('Organization name is required', { status: 400 });
    }

    // Create new organization
    const organization = await organizationModel.create({
      name,
      description: description || undefined,
      owner: user._id!,
    });

    // Add organization to user's organizations list
    await userModel.addOrganization(user._id!, organization._id!);

    return new Response(JSON.stringify({
      id: organization._id?.toString(),
      name: organization.name,
      description: organization.description,
      owner: organization.owner.toString(),
      users: organization.users.map(userId => userId.toString()),
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
