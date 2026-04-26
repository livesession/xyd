import React, { useState, useEffect } from "react";

/**
 * Self-contained login page. Uses xyd design tokens via CSS custom properties.
 * Styles are in styles/login.css, injected via the plugin's `head` config.
 * Uses `part` attributes for CSS targeting — same pattern as xyd-ui/xyd-components.
 */
export default function LoginPage() {
  const [config, setConfig] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const globalConfig = (window as any).__xydAccessControlSettings?.accessControlConfig;
    if (globalConfig) {
      setConfig(globalConfig);
      return;
    }
    // @ts-ignore
    import("virtual:xyd-access-control-settings")
      .then((mod: any) => setConfig(mod.accessControlConfig))
      .catch(() => {});
  }, []);

  const providerType = config?.provider?.type || "jwt";
  const title = config?.login?.title || "Sign in to access documentation";
  const description = config?.login?.description || "";
  const logo = config?.login?.logo || "";
  const backgroundImage = config?.login?.backgroundImage;

  const loginUrl = config?.provider?.loginUrl || "";
  const authorizationUrl = config?.provider?.authorizationUrl || "";
  const hasExternalAuth = providerType === "oauth"
    ? !!authorizationUrl
    : !!loginUrl && loginUrl !== "/login";

  const handleRedirectLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";

    if (providerType === "oauth" && authorizationUrl) {
      const callbackPath = config?.provider?.callbackPath || "/auth/callback";
      const redirectUri = window.location.origin + callbackPath;
      const scopes = config?.provider?.scopes || [];
      const clientId = config?.provider?.clientId || "";

      const oauthParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes.join(" "),
        state: redirect,
      });

      window.location.href = `${authorizationUrl}?${oauthParams.toString()}`;
      return;
    }

    if (loginUrl && loginUrl !== "/login") {
      const sep = loginUrl.includes("?") ? "&" : "?";
      window.location.href = `${loginUrl}${sep}redirect=${encodeURIComponent(redirect)}`;
      return;
    }
  };

  const handleTestLogin = (groups: string[]) => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";
    const hasEdge = !!config?.edge;

    if (hasEdge) {
      const groupsParam = groups.length ? `&groups=${groups.join(",")}` : "";
      window.location.href = `/auth/test-login?redirect=${encodeURIComponent(redirect)}${groupsParam}`;
      return;
    }

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: "test-user",
      groups,
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
    }));
    const token = `${header}.${payload}.dGVzdA`;
    const cookieName = config?.session?.cookieName || "xyd-auth-token";

    localStorage.setItem(cookieName, token);
    document.cookie = `${cookieName}=${token}; path=/; max-age=86400; SameSite=Lax`;
    window.location.href = redirect;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Invalid password");
  };

  const bgOverride = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover" as const, backgroundPosition: "center", background: "none" }
    : undefined;

  return (
    <div className="xyd-login-page" style={bgOverride}>
      <div part="card">
        {logo && <img part="logo" src={logo} alt="" />}

        <h1 part="title">{title}</h1>

        {description && <p part="description">{description}</p>}

        {error && <p part="error">{error}</p>}

        {providerType === "password" ? (
          <form part="form" onSubmit={handlePasswordSubmit}>
            <input
              part="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
            <button part="button" type="submit">Continue</button>
          </form>
        ) : hasExternalAuth ? (
          <button part="button" onClick={handleRedirectLogin}>Sign in</button>
        ) : (
          <div part="actions">
            <button part="button" onClick={() => handleTestLogin([])}>
              Sign in as User
            </button>
            <button part="button" data-kind="secondary" onClick={() => handleTestLogin(["admin"])}>
              Sign in as Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}