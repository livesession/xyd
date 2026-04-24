import React, { useEffect, useState } from "react";

/**
 * Handles both JWT and OAuth callback flows:
 *
 * JWT:   /auth/jwt-callback#eyJ...  → extract token from hash
 * OAuth: /auth/callback?code=XXX&state=/page → exchange code for token
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // @ts-ignore - virtual module resolved by Vite at runtime
    import("virtual:xyd-access-control-settings")
      .then((mod: any) => {
        const config = mod.accessControlConfig;
        handleCallback(config);
      })
      .catch(() => {
        // Fallback: try JWT flow without config
        handleCallback(null);
      });
  }, []);

  function storeTokenAndRedirect(
    token: string,
    groups: string[],
    redirect: string,
    cookieName: string
  ) {
    localStorage.setItem(cookieName, token);
    document.cookie = `${cookieName}=${token}; path=/; max-age=86400; SameSite=Lax`;

    (window as any).__xydAuthState = {
      authenticated: true,
      groups,
      token,
    };
    document.documentElement.setAttribute("data-auth", "authenticated");
    window.location.href = redirect;
  }

  async function handleCallback(config: any) {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.slice(1);
    const code = params.get("code");
    const state = params.get("state") || "/";
    const cookieName = config?.session?.cookieName || "xyd-auth-token";
    const groupsClaim = config?.provider?.groupsClaim || "groups";

    // OAuth flow: code in query params
    if (code && config?.provider?.type === "oauth") {
      try {
        await handleOAuthCallback(code, state, config, cookieName, groupsClaim);
      } catch (e) {
        setError(e instanceof Error ? e.message : "OAuth authentication failed");
      }
      return;
    }

    // JWT flow: token in hash fragment
    if (hash) {
      try {
        handleJWTCallback(hash, state, cookieName, groupsClaim);
      } catch (e) {
        setError(e instanceof Error ? e.message : "JWT authentication failed");
      }
      return;
    }

    setError("No authentication data found in callback URL.");
  }

  function handleJWTCallback(
    hash: string,
    redirect: string,
    cookieName: string,
    groupsClaim: string
  ) {
    const parts = hash.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error("Token has expired");
    }

    storeTokenAndRedirect(hash, payload[groupsClaim] || [], redirect, cookieName);
  }

  async function handleOAuthCallback(
    code: string,
    redirect: string,
    config: any,
    cookieName: string,
    groupsClaim: string
  ) {
    const tokenUrl = config.provider.tokenUrl;
    const userInfoUrl = config.provider.userInfoUrl;
    const clientId = config.provider.clientId || "";
    const callbackPath = config.provider.callbackPath || "/auth/callback";
    const redirectUri = window.location.origin + callbackPath;

    if (!tokenUrl) throw new Error("No token URL configured");

    // Exchange code for access token
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No access token in response");

    // Fetch user info to get groups/roles
    let groups: string[] = [];
    if (userInfoUrl) {
      try {
        const userRes = await fetch(userInfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userRes.ok) {
          const userInfo = await userRes.json();
          groups = userInfo[groupsClaim] || userInfo.roles || userInfo.groups || [];
        }
      } catch {
        // User info fetch failed — continue without groups
      }
    }

    // Create a session JWT from the access token info
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: "oauth-user",
      [groupsClaim]: groups,
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
      access_token: accessToken,
    }));
    const sessionToken = `${header}.${payload}.oauth`;

    storeTokenAndRedirect(sessionToken, groups, redirect, cookieName);
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        minHeight: "100vh",
      }}>
        <h2 style={{ color: "#ef4444", marginBottom: 8 }}>Authentication Error</h2>
        <p style={{ color: "#6e6e80", fontSize: 14 }}>{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            fontSize: 14,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Go to homepage
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      minHeight: "100vh",
      color: "#6e6e80",
    }}>
      Authenticating...
    </div>
  );
}
