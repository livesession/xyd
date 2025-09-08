export async function action() {
    try {
        // Clear the session cookie
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
            }
        });
    } catch (error) {
        console.error('Error signing out:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}