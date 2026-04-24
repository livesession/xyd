#!/usr/bin/env node

/**
 * Mock OAuth 2.0 server for testing xyd access control.
 * Implements the Authorization Code flow with a simple HTML login form.
 *
 * Endpoints:
 *   GET  /authorize     — Shows login form, redirects with code
 *   POST /token         — Exchanges code for access token (JWT)
 *   GET  /userinfo      — Returns user info with groups/roles
 *
 * Usage:
 *   node mock-oauth-server.mjs
 *   # Runs on http://localhost:4000
 *
 * Test users:
 *   user@test.com    / password  → groups: []
 *   admin@test.com   / password  → groups: ["admin"]
 */

import { createServer } from "node:http";
import { URL } from "node:url";

const PORT = 4000;
const CLIENT_ID = "mock-client-id";

// In-memory store for authorization codes and tokens
const codes = new Map();
const tokens = new Map();

const USERS = {
  "user@test.com": { sub: "user-1", email: "user@test.com", name: "Test User", groups: [] },
  "admin@test.com": { sub: "admin-1", email: "admin@test.com", name: "Test Admin", groups: ["admin"] },
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).toString("base64url");
  const sig = Buffer.from("mock-signature").toString("base64url");
  return `${header}.${body}.${sig}`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // GET /authorize — show login form
  if (method === "GET" && url.pathname === "/authorize") {
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    const state = url.searchParams.get("state") || "";

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!DOCTYPE html>
<html><head><title>Mock OAuth Login</title>
<style>
  body { font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
  .card { background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.1); max-width: 360px; width: 100%; }
  h2 { margin: 0 0 8px; font-size: 20px; }
  p { color: #666; font-size: 13px; margin: 0 0 24px; }
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  input { width: 100%; padding: 8px 10px; font-size: 14px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px; box-sizing: border-box; }
  button { width: 100%; padding: 10px; font-size: 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .users { background: #f8f9fa; border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
  .users code { background: #e9ecef; padding: 1px 4px; border-radius: 3px; }
</style></head>
<body><div class="card">
  <h2>Mock OAuth Login</h2>
  <p>This is a test OAuth server for xyd access control.</p>
  <div class="users">
    <strong>Test accounts:</strong><br>
    <code>user@test.com</code> / <code>password</code> — regular user<br>
    <code>admin@test.com</code> / <code>password</code> — admin
  </div>
  <form method="POST" action="/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}">
    <label>Email</label>
    <input name="email" type="email" value="user@test.com" required />
    <label>Password</label>
    <input name="password" type="password" value="password" required />
    <button type="submit">Sign in</button>
  </form>
</div></body></html>`);
    return;
  }

  // POST /authorize — validate credentials, redirect with code
  if (method === "POST" && url.pathname === "/authorize") {
    let body = "";
    req.on("data", (c) => body += c);
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const email = params.get("email");
      const password = params.get("password");
      const redirectUri = url.searchParams.get("redirect_uri") || "";
      const state = url.searchParams.get("state") || "";

      const user = USERS[email];
      if (!user || password !== "password") {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Invalid credentials");
        return;
      }

      const code = generateId();
      codes.set(code, { user, redirectUri });

      const sep = redirectUri.includes("?") ? "&" : "?";
      res.writeHead(302, { Location: `${redirectUri}${sep}code=${code}&state=${state}` });
      res.end();
    });
    return;
  }

  // POST /token — exchange code for access token
  if (method === "POST" && url.pathname === "/token") {
    let body = "";
    req.on("data", (c) => body += c);
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const code = params.get("code");

      const codeData = codes.get(code);
      if (!codeData) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid_grant" }));
        return;
      }

      codes.delete(code);

      const accessToken = createJWT(codeData.user);
      tokens.set(accessToken, codeData.user);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 86400,
      }));
    });
    return;
  }

  // GET /userinfo — return user info
  if (method === "GET" && url.pathname === "/userinfo") {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    const user = tokens.get(token);

    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid_token" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      sub: user.sub,
      email: user.email,
      name: user.name,
      roles: user.groups,
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Mock OAuth server running at http://localhost:${PORT}`);
  console.log(`  Authorization URL: http://localhost:${PORT}/authorize`);
  console.log(`  Token URL:         http://localhost:${PORT}/token`);
  console.log(`  User Info URL:     http://localhost:${PORT}/userinfo`);
  console.log(`\nTest accounts:`);
  console.log(`  user@test.com  / password  → regular user`);
  console.log(`  admin@test.com / password  → admin`);
});
