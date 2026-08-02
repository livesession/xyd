import React from "react";
import { hydrateRoot } from "react-dom/client";

import App from "./App";

hydrateRoot(document.getElementById("root")!, <App />);

// Bun HMR boundary (plan S1). For now a full-reload fallback is fine — xyd's
// dev model is already reload-centric (see plan R4).
// @ts-ignore - import.meta.hot is a Bun/Vite dev-only global
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept();
}
