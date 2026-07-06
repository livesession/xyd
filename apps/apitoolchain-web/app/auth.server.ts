import { redirect } from "react-router";
import { getMe, type User } from "~/data";

/**
 * Gate a route on an authenticated session. Reads the current user via
 * `/auth/me` (the bearer is attached by the root middleware); redirects to
 * `/login` when there's no valid session.
 */
export async function requireUser(): Promise<User> {
  const user = await getMe();
  if (!user) throw redirect("/login");
  return user;
}
