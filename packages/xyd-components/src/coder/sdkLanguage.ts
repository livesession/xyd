import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// The page-wide code language.
//
// ONE value shared by every language switcher of a site: the API reference's
// SDK switcher (`Shell` + the SDK languages — Atlas feeds it through its
// SdkLanguageProvider) and the markdown `:::code-group` blocks whose tabs are
// different languages (CodeTabs joins them on its own). It is persisted under
// one localStorage key, seeded from `?lang=<id>` in the URL, and written back
// to the URL on change, so a copied link carries the reader's language.
//
// Browser-only: on the server every read is null and a page renders its
// defaults; the client swaps in the stored language after hydration (the hook
// is a useSyncExternalStore with a null server snapshot — no mismatch).
// ---------------------------------------------------------------------------

/** The localStorage key of the page-wide language. */
export const SDK_LANGUAGE_STORAGE_KEY = "xyd:sdk-language";

/** The URL query parameter that seeds (and mirrors) the page-wide language. */
export const SDK_LANGUAGE_URL_PARAM = "lang";

// A code fence / tab language id → the id the switcher stores. The SDK ids are
// opensdk's; the raw-HTTP (cURL) entry and every shell flavour are "shell".
const ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
  js: "javascript",
  jsx: "javascript",
  javascript: "javascript",
  node: "javascript",
  nodejs: "javascript",
  py: "python",
  python: "python",
  go: "go",
  golang: "go",
  rb: "ruby",
  ruby: "ruby",
  java: "java",
  kt: "kotlin",
  kotlin: "kotlin",
  cs: "csharp",
  csharp: "csharp",
  "c#": "csharp",
  dotnet: "csharp",
  php: "php",
  rs: "rust",
  rust: "rust",
  swift: "swift",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  shell: "shell",
  shellscript: "shell",
  console: "shell",
  powershell: "shell",
  cmd: "shell",
  curl: "shell",
};

/** The stored id of a code language (`ts` → `typescript`, `bash` / `curl` →
 * `shell`), or null for an id that is not a switcher language (`json`). */
export function canonicalSdkLanguage(id?: string | null): string | null {
  if (!id) return null;
  const key = String(id).trim().toLowerCase().replace(/^language-/, "");
  return ALIASES[key] ?? null;
}

/**
 * The tabs of a LANGUAGE group — a code sample whose two or more tabs are all
 * known languages, every one different — as a map from the tab value
 * (`meta || lang`, the switcher value) to the stored language id. null for
 * anything else: a single block, an `npm | pnpm | yarn` group (all shell), a
 * `config.json | run.sh` pair, or two TypeScript tabs titled `Client | Server`.
 * A language group follows the page-wide language; the others keep a local tab.
 */
export function languageGroupTabs(
  tabs: ReadonlyArray<{ lang?: string; meta?: string }> | undefined,
): Map<string, string> | null {
  if (!tabs || tabs.length < 2) return null;
  const byValue = new Map<string, string>();
  const seen = new Set<string>();
  for (const tab of tabs) {
    const id = canonicalSdkLanguage(tab.lang) ?? canonicalSdkLanguage(tab.meta);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    byValue.set(tab.meta || tab.lang || "", id);
  }
  return byValue;
}

/** The tab value of `group` showing `language` (any alias of it), or undefined. */
export function languageGroupTab(group: Map<string, string>, language: string | null): string | undefined {
  const wanted = canonicalSdkLanguage(language) ?? language;
  if (!wanted) return undefined;
  for (const [value, id] of group) {
    if (id === wanted) return value;
  }
  return undefined;
}

export interface SdkLanguageStore {
  /** The stored language, or null: on the server, when nothing is stored, or
   * when the only `?lang=` is an unknown id. */
  get(): string | null;
  /** Store `lang` (canonicalised): memory, localStorage and the URL's `?lang=`;
   * notifies the subscribers. */
  set(lang: string): void;
  subscribe(listener: () => void): () => void;
}

const stores = new Map<string, SdkLanguageStore>();
const inBrowser = () => typeof window !== "undefined";

function createStore(key: string): SdkLanguageStore {
  let current: string | null | undefined; // undefined = not read yet
  const listeners = new Set<() => void>();

  const readStorage = (): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const writeStorage = (lang: string) => {
    try {
      window.localStorage.setItem(key, lang);
    } catch {
      /* private mode / quota */
    }
  };
  const writeUrl = (lang: string) => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(SDK_LANGUAGE_URL_PARAM) === lang) return;
      url.searchParams.set(SDK_LANGUAGE_URL_PARAM, lang);
      // replaceState, not pushState: the language is view state, not a history
      // entry; the router's own state is kept.
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* no history API (a sandboxed frame) */
    }
  };
  // The first read on the client: `?lang=` wins and is persisted (a shared link
  // seeds the key), else whatever an earlier visit stored.
  const init = (): string | null => {
    if (!inBrowser()) return null;
    const fromUrl = canonicalSdkLanguage(new URLSearchParams(window.location.search).get(SDK_LANGUAGE_URL_PARAM));
    if (fromUrl) {
      writeStorage(fromUrl);
      return fromUrl;
    }
    return readStorage();
  };

  return {
    get() {
      if (current === undefined) current = init();
      return current;
    },
    set(lang) {
      const next = canonicalSdkLanguage(lang) ?? String(lang ?? "").trim().toLowerCase();
      if (!next) return;
      current = next;
      if (inBrowser()) {
        writeStorage(next);
        writeUrl(next);
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The store behind `key` — one per key; the default key is the page-wide language. */
export function sdkLanguageStore(key: string = SDK_LANGUAGE_STORAGE_KEY): SdkLanguageStore {
  let store = stores.get(key);
  if (!store) {
    store = createStore(key);
    stores.set(key, store);
  }
  return store;
}

/** Forget every store (tests: the next read starts from the URL / localStorage again). */
export function resetSdkLanguageStores(): void {
  stores.clear();
}

const serverSnapshot = () => null;

/** The page-wide language as `[language | null, setLanguage]`, live across
 * every subscriber on the page (one switcher's pick updates the others). */
export function useSdkLanguageStore(key: string = SDK_LANGUAGE_STORAGE_KEY): [string | null, (lang: string) => void] {
  const store = sdkLanguageStore(key);
  const language = useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
  const setLanguage = useCallback((lang: string) => store.set(lang), [store]);
  return [language, setLanguage];
}
