import { redirect } from "react-router";
import { logout } from "~/data";
import { destroySessionCookie } from "~/sessions.server";
import type { Route } from "./+types/logout";

/** POST /logout — revoke the session server-side + clear the cookie. */
export async function action({ request }: Route.ActionArgs) {
  await logout();
  throw redirect("/login", {
    headers: { "Set-Cookie": await destroySessionCookie(request) },
  });
}

// A bare GET shouldn't linger on /logout.
export async function loader() {
  throw redirect("/login");
}
