import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isDevEnvironment as isDevEnv } from "../devOnly";

export interface AccessControlActions {
  /** Current auth config from docs.json */
  config: any | null;
  /** Whether config has loaded */
  ready: boolean;
  /** Last error message */
  error: string;
  /** Clear error */
  clearError: () => void;

  // --- Auth actions ---

  /** Redirect to external OAuth provider */
  signInWithOAuth: () => void;
  /** Redirect to external JWT login URL */
  signInWithRedirect: () => void;
  /** Sign in with test token (dev/edge server) */
  signInAsUser: () => void;
  /** Sign in as admin with test token (dev/edge server) */
  signInAsAdmin: () => void;
  /** Sign in with specific groups */
  signInWithGroups: (groups: string[]) => void;
  /** Submit password (for password provider) */
  submitPassword: (password: string) => void;

  // --- Info ---

  /** Provider type: "jwt" | "oauth" | "password" */
  providerType: string;
  /** Whether an external auth URL is configured */
  hasExternalAuth: boolean;
  /** Login page title from config */
  title: string;
  /** Login page description from config */
  description: string;
  /** Login page logo URL from config */
  logo: string;
  /** Login page background image from config */
  backgroundImage: string;
  /** The redirect URL (where to go after login) */
  redirectUrl: string;
}

const AccessControlCtx = createContext<AccessControlActions | null>(null);

/**
 * Hook to access auth actions in custom login pages.
 *
 * @example
 * ```tsx
 * import { useAccessControl } from "@xyd-js/plugin-access-control"
 *
 * function MyLoginPage() {
 *   const { signInWithOAuth, title, logo, error } = useAccessControl()
 *
 *   return (
 *     <div>
 *       {logo && <img src={logo} />}
 *       <h1>{title}</h1>
 *       {error && <p>{error}</p>}
 *       <button onClick={signInWithOAuth}>Sign in</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAccessControl(): AccessControlActions {
  const ctx = useContext(AccessControlCtx);
  if (!ctx) {
    throw new Error("useAccessControl must be used inside <AccessControlProvider>");
  }
  return ctx;
}

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const globalConfig = (window as any).__xydAccessControlSettings?.accessControlConfig;
    if (globalConfig) {
      setConfig(globalConfig);
      setReady(true);
      return;
    }
    // @ts-ignore
    import("virtual:xyd-access-control-settings")
      .then((mod: any) => { setConfig(mod.accessControlConfig); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  const providerType = config?.provider?.type || "jwt";
  const loginUrl = config?.provider?.loginUrl || "";
  const authorizationUrl = config?.provider?.authorizationUrl || "";
  const hasExternalAuth = providerType === "oauth"
    ? !!authorizationUrl
    : !!loginUrl && loginUrl !== "/login";

  // login can be a string (custom component path) or an object (config)
  const loginConfig = typeof config?.login === "string" ? {} : (config?.login || {});
  const title = loginConfig.title || "Sign in to access documentation";
  const description = loginConfig.description || "";
  const logo = loginConfig.logo || "";
  const backgroundImage = loginConfig.backgroundImage || "";

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const redirectUrl = params?.get("redirect") || "/";

  const storeTokenAndRedirect = useCallback((token: string) => {
    const cookieName = config?.session?.cookieName || "xyd-auth-token";
    localStorage.setItem(cookieName, token);
    document.cookie = `${cookieName}=${token}; path=/; max-age=86400; SameSite=Lax`;
    window.location.href = redirectUrl;
  }, [config, redirectUrl]);

  const signInWithOAuth = useCallback(() => {
    if (!authorizationUrl) { setError("No OAuth authorization URL configured"); return; }
    const callbackPath = config?.provider?.callbackPath || "/auth/callback";
    const redirectUri = window.location.origin + callbackPath;
    const scopes = config?.provider?.scopes || [];
    const clientId = config?.provider?.clientId || "";

    const oauthParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state: redirectUrl,
    });
    window.location.href = `${authorizationUrl}?${oauthParams.toString()}`;
  }, [config, authorizationUrl, redirectUrl]);

  const signInWithRedirect = useCallback(() => {
    if (!loginUrl || loginUrl === "/login") { setError("No external login URL configured"); return; }
    const sep = loginUrl.includes("?") ? "&" : "?";
    window.location.href = `${loginUrl}${sep}redirect=${encodeURIComponent(redirectUrl)}`;
  }, [loginUrl, redirectUrl]);

  const signInWithGroups = useCallback((groups: string[]) => {
    // Production with deploy config: use /auth/test-login (server-signed)
    const hasDeploy = !!config?.deploy;
    if (hasDeploy) {
      const groupsParam = groups.length ? `&groups=${groups.join(",")}` : "";
      window.location.href = `/auth/test-login?redirect=${encodeURIComponent(redirectUrl)}${groupsParam}`;
      return;
    }

    // Dev only: generate unsigned client-side token
    if (!isDevEnv()) {
      setError("Test login is only available in development mode.");
      return;
    }
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: "test-user",
      groups,
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
    }));
    storeTokenAndRedirect(`${header}.${payload}.dGVzdA`);
  }, [config, redirectUrl, storeTokenAndRedirect]);

  const signInAsUser = useCallback(() => signInWithGroups([]), [signInWithGroups]);
  const signInAsAdmin = useCallback(() => signInWithGroups(["admin"]), [signInWithGroups]);

  const submitPassword = useCallback((password: string) => {
    // Password flow goes through external server, same as JWT redirect
    setError("Invalid password");
  }, []);

  const value: AccessControlActions = {
    config,
    ready,
    error,
    clearError: () => setError(""),
    signInWithOAuth,
    signInWithRedirect,
    signInAsUser,
    signInAsAdmin,
    signInWithGroups,
    submitPassword,
    providerType,
    hasExternalAuth,
    title,
    description,
    logo,
    backgroundImage,
    redirectUrl,
  };

  return <AccessControlCtx.Provider value={value}>{children}</AccessControlCtx.Provider>;
}