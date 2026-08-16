import * as React from "react";
import type { RouterStore } from "./types";

export const RouterContext = React.createContext<RouterStore | null>(null);

export function RouterProvider({ store, children }: { store: RouterStore; children: React.ReactNode }) {
  // Browser-only: install the history patch + popstate listener. `install()` is
  // a no-op on the server (window guard), so this effect never runs during SSR.
  React.useEffect(() => store.install(), [store]);
  return <RouterContext.Provider value={store}>{children}</RouterContext.Provider>;
}
