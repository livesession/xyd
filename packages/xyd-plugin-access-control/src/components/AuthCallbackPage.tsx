import React, { useEffect, useState } from "react";

interface AuthCallbackPageProps {
  cookieName?: string;
  groupsClaim?: string;
}

export default function AuthCallbackPage({
  cookieName = "xyd-auth-token",
  groupsClaim = "groups",
}: AuthCallbackPageProps) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";

    if (!hash) {
      setError("No token found in callback URL.");
      return;
    }

    try {
      const parts = hash.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");

      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token has expired");
      }

      localStorage.setItem(cookieName, hash);
      document.cookie = `${cookieName}=${hash}; path=/; max-age=86400; SameSite=Lax`;

      (window as any).__xydAuthState = {
        authenticated: true,
        groups: payload[groupsClaim] || [],
        token: hash,
      };
      document.documentElement.setAttribute("data-auth", "authenticated");

      window.location.href = redirect;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    }
  }, []);

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
      }}>
        <h2 style={{ color: "#ef4444", marginBottom: 8 }}>Authentication Error</h2>
        <p style={{ color: "var(--dark48, #6e6e80)", fontSize: 14 }}>{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            fontSize: 14,
            background: "var(--color-primary, #2563eb)",
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
      color: "var(--dark48, #6e6e80)",
    }}>
      Authenticating...
    </div>
  );
}
