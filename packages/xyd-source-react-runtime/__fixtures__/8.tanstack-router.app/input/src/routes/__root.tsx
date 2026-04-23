import { createRootRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: () => (
        <div>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/employees">Employees</Link>
            </nav>
            <Outlet />
        </div>
    ),
});
