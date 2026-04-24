#!/usr/bin/env node

/**
 * Generate test JWT tokens for the access control playground.
 * These tokens use a simple base64-encoded payload (no real signature).
 * For testing purposes only.
 *
 * Usage:
 *   node generate-test-tokens.mjs
 *
 * Then paste the token into your browser console:
 *   localStorage.setItem('xyd-auth-token', '<token>');
 *   location.reload();
 */

function createTestJWT(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa("test-signature");
  return `${header}.${body}.${signature}`;
}

// Token that expires far in the future
const farFuture = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

const tokens = {
  anonymous: {
    description: "Anonymous user (no token - just remove from localStorage)",
    token: null,
  },
  authenticated: {
    description: "Authenticated user with no groups",
    payload: { sub: "user-1", groups: [], exp: farFuture, iat: Math.floor(Date.now() / 1000) },
  },
  admin: {
    description: 'Admin user with "admin" group',
    payload: { sub: "admin-1", groups: ["admin"], exp: farFuture, iat: Math.floor(Date.now() / 1000) },
  },
  multi: {
    description: 'User with multiple groups',
    payload: { sub: "multi-1", groups: ["admin", "staff", "premium"], exp: farFuture, iat: Math.floor(Date.now() / 1000) },
  },
  expired: {
    description: "Expired token (should be treated as anonymous)",
    payload: { sub: "expired-1", groups: ["admin"], exp: 1000000000, iat: 1000000000 },
  },
};

console.log("=== Access Control Playground - Test Tokens ===\n");

for (const [name, config] of Object.entries(tokens)) {
  console.log(`--- ${name} ---`);
  console.log(`Description: ${config.description}`);

  if (config.payload) {
    const token = createTestJWT(config.payload);
    console.log(`Token: ${token}`);
    console.log(`\nBrowser console command:`);
    console.log(`  localStorage.setItem('xyd-auth-token', '${token}'); location.reload();`);
  } else {
    console.log(`\nBrowser console command:`);
    console.log(`  localStorage.removeItem('xyd-auth-token'); location.reload();`);
  }
  console.log();
}

console.log("=== Quick Reference ===");
console.log("Anonymous:     localStorage.removeItem('xyd-auth-token'); location.reload();");

const authToken = createTestJWT(tokens.authenticated.payload);
const adminToken = createTestJWT(tokens.admin.payload);

console.log(`Authenticated: localStorage.setItem('xyd-auth-token', '${authToken}'); location.reload();`);
console.log(`Admin:         localStorage.setItem('xyd-auth-token', '${adminToken}'); location.reload();`);
