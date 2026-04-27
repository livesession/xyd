import React, { useState } from "react";
import { AccessControlProvider, useAccessControl } from "./AccessControlContext";

/**
 * Default login page. Wraps itself with AccessControlProvider
 * so it works regardless of the host wrapper.
 */
export default function LoginPage() {
  return (
    <AccessControlProvider>
      <LoginPageUI />
    </AccessControlProvider>
  );
}

function LoginPageUI() {
  const {
    providerType,
    hasExternalAuth,
    title,
    description,
    logo,
    backgroundImage,
    error,
    signInWithOAuth,
    signInWithRedirect,
    signInAsUser,
    signInAsAdmin,
    submitPassword,
  } = useAccessControl();

  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    if (providerType === "oauth") signInWithOAuth();
    else signInWithRedirect();
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
          <form part="form" onSubmit={(e) => { e.preventDefault(); submitPassword(password); }}>
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
          <button part="button" onClick={handleSignIn}>Sign in</button>
        ) : (
          <div part="actions">
            <button part="button" onClick={signInAsUser}>Sign in as User</button>
            <button part="button" data-kind="secondary" onClick={signInAsAdmin}>Sign in as Admin</button>
          </div>
        )}
      </div>
    </div>
  );
}