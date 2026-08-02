import React, { useState } from "react";

/**
 * WIP Bun dev server (plan S1) — shared SSR/CSR component used to prove the
 * Bun.serve (server-render) + Bun.build (client bundle) + hydrate path works
 * with zero Vite and zero React Router. The interactive counter proves that
 * hydration actually wires up client-side handlers, not just static HTML.
 */
export default function App() {
  const [n, setN] = useState(0);
  return (
    <div id="app">
      <h1>xyd — Bun.serve dev (no Vite, no React Router)</h1>
      <p>Server-rendered by react-dom/server, hydrated by a Bun.build bundle.</p>
      <button type="button" onClick={() => setN((v) => v + 1)}>
        count: {n}
      </button>
    </div>
  );
}
