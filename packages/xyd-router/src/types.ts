export type To = string | { pathname?: string; search?: string; hash?: string };
export type NavState = "idle" | "loading" | "submitting";

export interface RLoc {
  pathname: string;
  search: string;
  hash: string;
  key?: string;
}
export interface RMatch {
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: any;
  handle?: any;
}
export interface Snap {
  location: RLoc;
  matches: RMatch[];
  navigation: { state: NavState; location?: RLoc };
  loaderData: any;
}

export interface RouterStore {
  subscribe(fn: () => void): () => void;
  getSnapshot(): Snap;
  getServerSnapshot(): Snap;
  navigate(to: To, opts?: { replace?: boolean }): Promise<void>;
  install(): () => void;
  /** Route-prefix (e.g. "/docs"), or "" when unset. Rendered link hrefs +
   *  browser history entries carry it; the internal location stays basename-free
   *  (React Router semantics). */
  basename: string;
}

export interface RouterInit {
  location: RLoc;
  matches: RMatch[];
  /** Browser-only page-data fetcher; omitted on the server. `signal` aborts a
   *  superseded fetch (rapid nav) so its side effects (title) don't apply. */
  loadPageData?: (url: URL, signal?: AbortSignal) => Promise<{ matches: RMatch[] }>;
  /** URL route-prefix (`advanced.basename`, e.g. "/docs"). Applied to rendered
   *  hrefs + history; stripped from the internal location. Default "". */
  basename?: string;
}
