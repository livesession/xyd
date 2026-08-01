import { randomUUID } from "node:crypto";

/**
 * Server-only OAuth support for connecting GitHub / GitLab without pasting a
 * personal access token. The OAuth *app* (client id + secret) is configured via
 * env on the web server; the user just authorizes. The obtained access token is
 * then stored the same way a manual token is (via `connectGitProvider`), so the
 * rest of the stack is unchanged. Gitea / Bitbucket keep the token form.
 *
 * Required env per provider (nothing is bundled to the client):
 *   GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET   (scope: GITHUB_OAUTH_SCOPE, default "repo")
 *   GITLAB_OAUTH_CLIENT_ID / GITLAB_OAUTH_CLIENT_SECRET   (scope: GITLAB_OAUTH_SCOPE, default "api";
 *                                                          self-hosted: GITLAB_BASE_URL)
 * Register the OAuth app's callback URL as `<origin>/settings/connections/oauth/<kind>`.
 */

export type OAuthKind = "github" | "gitlab";

export interface OAuthProvider {
  kind: OAuthKind;
  label: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
}

const env = (k: string): string | undefined =>
  process.env[k]?.trim() || undefined;

/** Resolve a provider's OAuth app config from env, or `null` when unconfigured. */
export function oauthProvider(kind: string): OAuthProvider | null {
  if (kind === "github") {
    const clientId = env("GITHUB_OAUTH_CLIENT_ID");
    const clientSecret = env("GITHUB_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;
    return {
      kind: "github",
      label: "GitHub",
      clientId,
      clientSecret,
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: env("GITHUB_OAUTH_SCOPE") ?? "repo",
    };
  }
  if (kind === "gitlab") {
    const clientId = env("GITLAB_OAUTH_CLIENT_ID");
    const clientSecret = env("GITLAB_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;
    const base = (env("GITLAB_BASE_URL") ?? "https://gitlab.com").replace(
      /\/$/,
      "",
    );
    return {
      kind: "gitlab",
      label: "GitLab",
      clientId,
      clientSecret,
      authorizeUrl: `${base}/oauth/authorize`,
      tokenUrl: `${base}/oauth/token`,
      scope: env("GITLAB_OAUTH_SCOPE") ?? "api",
    };
  }
  return null;
}

/** Which OAuth providers are configured — passed to the UI to gate the buttons. */
export function oauthConfigured(): Record<OAuthKind, boolean> {
  return {
    github: oauthProvider("github") !== null,
    gitlab: oauthProvider("gitlab") !== null,
  };
}

export const newOAuthState = (): string => randomUUID();

/** The provider authorize URL to redirect the user to. */
export function authorizeUrl(
  p: OAuthProvider,
  redirectUri: string,
  state: string,
): string {
  const u = new URL(p.authorizeUrl);
  u.searchParams.set("client_id", p.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", p.scope);
  u.searchParams.set("state", state);
  u.searchParams.set("response_type", "code");
  return u.toString();
}

/** Exchange the callback `code` for an access token. Throws on failure. */
export async function exchangeCodeForToken(
  p: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(p.tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: p.clientId,
      client_secret: p.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        `token exchange failed (HTTP ${res.status})`,
    );
  }
  return data.access_token;
}
