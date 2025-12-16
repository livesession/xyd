import { redirect, Outlet } from "react-router";

import { verifyToken, extractTokenFromCookie } from "~/lib/jwt";

export async function clientLoader() { }
clientLoader.hydrate = true as const

export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Extract and verify JWT token from cookies
    const token = extractTokenFromCookie(request.headers.get('Cookie'));
    const isAuthenticated = token ? verifyToken(token) !== null : false;

    // If authenticated and trying to access signin page, redirect to home
    if (isAuthenticated && pathname === '/signin' || pathname === '/') {
        return redirect('/app/home');
    }

    // If not authenticated and trying to access protected routes (anything under /app)
    if (!isAuthenticated && pathname !== '/signin') {
        return redirect('/signin');
    }

    return {};
}

export function Guard({ children }: { children: React.ReactNode }) {
    return <Outlet />;
}