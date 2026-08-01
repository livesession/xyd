import { redirect } from "react-router";
import { connectGitProvider, type GitProviderKind } from "~/data";
import {
  authorizeUrl,
  exchangeCodeForToken,
  newOAuthState,
  oauthProvider,
} from "~/oauth.server";
import type { Route } from "./+types/oauth.connect";

const BACK = "/settings/connections";
const STATE_COOKIE = "atc_oauth_state";
const COOKIE_PATH = "/settings/connections/oauth";

const fail = (msg: string) =>
  redirect(`${BACK}?oauth_error=${encodeURIComponent(msg)}`);

/**
 * One URL serves both legs of the OAuth flow (it is also the registered
 * callback): with no `?code` it starts the flow (redirect to the provider's
 * authorize page); with a `?code` it is the callback (verify state → exchange
 * for a token → store the connection). Resource route — no component, so it
 * never ships to the client.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const kind = params.kind as GitProviderKind;
  const provider = oauthProvider(kind);
  if (!provider) return fail(`${kind} OAuth is not configured`);

  const url = new URL(request.url);
  const redirectUri = `${url.origin}${COOKIE_PATH}/${kind}`;
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description");
  if (providerError) return fail(providerError);

  // START — send the user to the provider to authorize.
  if (!code) {
    const state = newOAuthState();
    return redirect(authorizeUrl(provider, redirectUri, state), {
      headers: {
        "Set-Cookie": `${STATE_COOKIE}=${state}; Path=${COOKIE_PATH}; Max-Age=600; HttpOnly; SameSite=Lax`,
      },
    });
  }

  // CALLBACK — verify the state cookie, then exchange + store.
  const cookie = request.headers.get("Cookie") ?? "";
  const saved = cookie.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!saved || saved !== url.searchParams.get("state")) {
    return fail("OAuth state mismatch — please try connecting again");
  }
  try {
    const token = await exchangeCodeForToken(provider, code, redirectUri);
    const result = await connectGitProvider({ kind, token });
    if (!result.ok) return fail(result.message);
    return redirect(`${BACK}?connected=${kind}`, {
      headers: {
        "Set-Cookie": `${STATE_COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0`,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "OAuth connect failed");
  }
}
