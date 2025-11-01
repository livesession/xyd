import { authServerService } from '~/services/auth.server';

export async function loader({ request }: { request: Request }) {
  try {
    const user = await authServerService.getCurentUserFromRequest(request);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return new Response(JSON.stringify({
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      organizations: user.organizations.map(orgId => orgId.toString()),
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}