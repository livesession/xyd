import React, { useState, useEffect } from "react";

/**
 * Self-contained login page. Reads config from the virtual module
 * and handles redirect/password flows without needing props.
 */
export default function LoginPage() {
  const [config, setConfig] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Import config from virtual module at runtime
    // @ts-ignore - virtual module resolved by Vite at runtime
    import("virtual:xyd-access-control-settings")
      .then((mod: any) => setConfig(mod.accessControlConfig))
      .catch(() => {});
  }, []);

  const providerType = config?.provider?.type || "jwt";
  const title = config?.login?.title || "Sign in to access documentation";
  const description = config?.login?.description || "";
  const logo = config?.login?.logo || "";

  // Determine the external auth URL based on provider type
  const loginUrl = config?.provider?.loginUrl || "";
  const authorizationUrl = config?.provider?.authorizationUrl || "";
  const hasExternalAuth = providerType === "oauth"
    ? !!authorizationUrl
    : !!loginUrl && loginUrl !== "/login";

  const handleRedirectLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";

    if (providerType === "oauth" && authorizationUrl) {
      // OAuth: redirect to authorization URL with proper OAuth params
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
      // JWT: redirect to external login URL
      const sep = loginUrl.includes("?") ? "&" : "?";
      window.location.href = `${loginUrl}${sep}redirect=${encodeURIComponent(redirect)}`;
      return;
    }
  };

  const handleTestLogin = (groups: string[]) => {
    // Generate a test JWT and store it
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
    // Also set as cookie so the server middleware can validate
    document.cookie = `${cookieName}=${token}; path=/; max-age=86400; SameSite=Lax`;
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get("redirect") || "/";
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Invalid password");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      minHeight: "100vh",
      maxWidth: 420,
      margin: "0 auto",
    }}>
      {logo && (
        <img src={logo} alt="" style={{ maxWidth: 80, marginBottom: 24 }} />
      )}

      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
        {title}
      </h1>

      {description && (
        <p style={{ color: "#6e6e80", fontSize: 14, marginBottom: 32, textAlign: "center" }}>
          {description}
        </p>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {providerType === "password" ? (
        <form onSubmit={handlePasswordSubmit} style={{ width: "100%" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              border: "1px solid #ececf1",
              borderRadius: 6,
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <button type="submit" style={btnStyle}>Continue</button>
        </form>
      ) : hasExternalAuth ? (
        <button onClick={handleRedirectLogin} style={btnStyle}>
          Sign in
        </button>
      ) : (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => handleTestLogin([])} style={btnStyle}>
            Sign in as User
          </button>
          <button onClick={() => handleTestLogin(["admin"])} style={{ ...btnStyle, backgroundColor: "#7c3aed" }}>
            Sign in as Admin
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
