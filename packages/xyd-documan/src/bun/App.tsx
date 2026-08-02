import React, { useState } from "react";
import { Callout, Badge } from "@xyd-js/components/writer";

/**
 * WIP Bun dev server (plan S1) — shared SSR/CSR component. Now renders REAL
 * @xyd-js/components (Linaria-styled) to prove xyd's actual UI stack
 * server-renders under Bun and hydrates from a Bun.build bundle, with the
 * pre-extracted component CSS — no Vite, no React Router. The interactive
 * counter proves hydration wires up client handlers.
 */
export default function App() {
  const [n, setN] = useState(0);
  return (
    <div id="app" style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>
        xyd — Bun.serve dev <Badge>alpha</Badge>
      </h1>
      <p>Real @xyd-js/components rendered by react-dom/server, hydrated by Bun.build — no Vite, no React Router.</p>
      <Callout kind="info">
        This <strong>Callout</strong> is a real xyd component (Linaria CSS) server-rendered under Bun.
      </Callout>
      <button type="button" onClick={() => setN((v) => v + 1)}>
        count: {n}
      </button>
    </div>
  );
}
