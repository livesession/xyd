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
}

export interface RouterInit {
  location: RLoc;
  matches: RMatch[];
  /** Browser-only page-data fetcher; omitted on the server. */
  loadPageData?: (url: URL) => Promise<{ matches: RMatch[] }>;
}
