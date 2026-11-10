import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SDK_LANGUAGE_STORAGE_KEY,
  canonicalSdkLanguage,
  languageGroupTab,
  languageGroupTabs,
  resetSdkLanguageStores,
  sdkLanguageStore,
  useSdkLanguageStore,
} from "../src/coder/sdkLanguage";

// The page-wide code language: ONE store behind the API reference's SDK
// switcher and the markdown code groups of different languages — persisted
// under one localStorage key, seeded from `?lang=`, mirrored back to the URL.
// The browser is faked (a location, a localStorage, a history) so the tests
// run in the node environment the suite uses.

function installWindow(href: string, stored: Record<string, string> = {}) {
  const storage = new Map(Object.entries(stored));
  const loc = { href };
  const win = {
    get location() {
      return { href: loc.href, search: new URL(loc.href).search };
    },
    localStorage: {
      getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
      setItem: (k: string, v: string) => {
        storage.set(k, String(v));
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
    },
    history: {
      state: { idx: 3 } as unknown,
      replaceState(state: unknown, _title: string, url: string | URL) {
        this.state = state;
        loc.href = String(url);
      },
    },
  };
  (globalThis as any).window = win;
  return { storage, href: () => loc.href, win };
}

afterEach(() => {
  delete (globalThis as any).window;
  resetSdkLanguageStores();
});

describe("canonicalSdkLanguage", () => {
  it("maps a fence / tab language to the stored id", () => {
    expect(canonicalSdkLanguage("ts")).toBe("typescript");
    expect(canonicalSdkLanguage("TypeScript")).toBe("typescript");
    expect(canonicalSdkLanguage("py")).toBe("python");
    expect(canonicalSdkLanguage("golang")).toBe("go");
    expect(canonicalSdkLanguage("language-go")).toBe("go");
    expect(canonicalSdkLanguage("cs")).toBe("csharp");
    expect(canonicalSdkLanguage("node")).toBe("javascript");
  });

  it("every shell flavour and cURL is the raw-HTTP `shell` entry", () => {
    for (const id of ["sh", "bash", "zsh", "shell", "console", "curl", "powershell"]) {
      expect(canonicalSdkLanguage(id)).toBe("shell");
    }
  });

  it("is null for a non-language id", () => {
    expect(canonicalSdkLanguage("json")).toBeNull();
    expect(canonicalSdkLanguage("yaml")).toBeNull();
    expect(canonicalSdkLanguage("")).toBeNull();
    expect(canonicalSdkLanguage(undefined)).toBeNull();
    expect(canonicalSdkLanguage(null)).toBeNull();
  });
});

describe("languageGroupTabs", () => {
  it("a group of different languages maps each tab value (meta || lang) to its language id", () => {
    const group = languageGroupTabs([
      { lang: "bash", meta: "curl" },
      { lang: "javascript" },
      { lang: "python", meta: "example.py" },
      { lang: "go" },
    ]);
    expect(group).not.toBeNull();
    expect([...group!.entries()]).toEqual([
      ["curl", "shell"],
      ["javascript", "javascript"],
      ["example.py", "python"],
      ["go", "go"],
    ]);
  });

  it("is null for a single block", () => {
    expect(languageGroupTabs([{ lang: "python" }])).toBeNull();
    expect(languageGroupTabs([])).toBeNull();
    expect(languageGroupTabs(undefined)).toBeNull();
  });

  it("is null for a group of one language — `npm | pnpm | yarn` install tabs, `Client | Server` TypeScript", () => {
    expect(
      languageGroupTabs([
        { lang: "bash", meta: "npm" },
        { lang: "bash", meta: "pnpm" },
        { lang: "bash", meta: "yarn" },
      ]),
    ).toBeNull();
    expect(languageGroupTabs([{ lang: "ts", meta: "Client" }, { lang: "typescript", meta: "Server" }])).toBeNull();
  });

  it("is null when any tab is not a language (`config.json | run.sh`)", () => {
    expect(languageGroupTabs([{ lang: "json", meta: "config.json" }, { lang: "sh", meta: "run.sh" }])).toBeNull();
    expect(languageGroupTabs([{ lang: "python" }, { lang: "text" }])).toBeNull();
  });
});

describe("languageGroupTab", () => {
  const group = languageGroupTabs([{ lang: "bash", meta: "curl" }, { lang: "ts", meta: "Node" }, { lang: "python" }])!;

  it("finds the tab showing a language, through any alias", () => {
    expect(languageGroupTab(group, "typescript")).toBe("Node");
    expect(languageGroupTab(group, "ts")).toBe("Node");
    expect(languageGroupTab(group, "shell")).toBe("curl");
    expect(languageGroupTab(group, "curl")).toBe("curl");
    expect(languageGroupTab(group, "python")).toBe("python");
  });

  it("is undefined for a language the group does not have, and for nothing stored", () => {
    expect(languageGroupTab(group, "go")).toBeUndefined();
    expect(languageGroupTab(group, null)).toBeUndefined();
  });
});

describe("sdkLanguageStore", () => {
  it("on the server (no window) reads null, and a set stays in memory without throwing", () => {
    const store = sdkLanguageStore();
    expect(store.get()).toBeNull();
    const listener = vi.fn();
    store.subscribe(listener);
    store.set("python");
    expect(store.get()).toBe("python");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("`?lang=<id>` seeds the language AND persists it under the key", () => {
    const { storage } = installWindow("https://docs.example.com/api/create-widget?lang=python");
    expect(sdkLanguageStore().get()).toBe("python");
    expect(storage.get(SDK_LANGUAGE_STORAGE_KEY)).toBe("python");
  });

  it("`?lang=` accepts an alias and wins over a stored language", () => {
    installWindow("https://docs.example.com/api/create-widget?lang=ts&tab=2", { [SDK_LANGUAGE_STORAGE_KEY]: "go" });
    expect(sdkLanguageStore().get()).toBe("typescript");
  });

  it("an unknown `?lang=` is ignored — the stored language (or nothing) shows", () => {
    installWindow("https://docs.example.com/api/create-widget?lang=cobol", { [SDK_LANGUAGE_STORAGE_KEY]: "ruby" });
    expect(sdkLanguageStore().get()).toBe("ruby");
    resetSdkLanguageStores();
    installWindow("https://docs.example.com/api/create-widget?lang=cobol");
    expect(sdkLanguageStore().get()).toBeNull();
  });

  it("without `?lang=` the stored language is restored", () => {
    installWindow("https://docs.example.com/api/create-widget", { [SDK_LANGUAGE_STORAGE_KEY]: "java" });
    expect(sdkLanguageStore().get()).toBe("java");
  });

  it("a set writes the storage AND mirrors `?lang=` into the URL (replaceState, other params kept) and notifies", () => {
    const { storage, href, win } = installWindow("https://docs.example.com/api/create-widget?tab=2#body");
    const store = sdkLanguageStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.set("ruby");
    expect(store.get()).toBe("ruby");
    expect(storage.get(SDK_LANGUAGE_STORAGE_KEY)).toBe("ruby");
    expect(href()).toBe("https://docs.example.com/api/create-widget?tab=2&lang=ruby#body");
    expect(win.history.state).toEqual({ idx: 3 }); // the router's state is kept
    expect(listener).toHaveBeenCalledTimes(1);

    store.set("go");
    expect(href()).toBe("https://docs.example.com/api/create-widget?tab=2&lang=go#body");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("a set canonicalises the id (`curl` is stored as `shell`) and ignores an empty one", () => {
    const { storage } = installWindow("https://docs.example.com/api/create-widget");
    const store = sdkLanguageStore();
    store.set("curl");
    expect(store.get()).toBe("shell");
    expect(storage.get(SDK_LANGUAGE_STORAGE_KEY)).toBe("shell");
    store.set("");
    expect(store.get()).toBe("shell");
  });

  it("a subscriber can unsubscribe", () => {
    installWindow("https://docs.example.com/api/create-widget");
    const store = sdkLanguageStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.set("python");
    expect(listener).not.toHaveBeenCalled();
  });

  it("is one store per key — the default key is shared by every caller; every key shares the one URL param", () => {
    const { storage, href } = installWindow("https://docs.example.com/api/create-widget");
    expect(sdkLanguageStore()).toBe(sdkLanguageStore(SDK_LANGUAGE_STORAGE_KEY));
    const other = sdkLanguageStore("other:key");
    expect(other).not.toBe(sdkLanguageStore());

    other.set("java");
    expect(storage.get("other:key")).toBe("java");
    expect(storage.has(SDK_LANGUAGE_STORAGE_KEY)).toBe(false);
    // the URL carries ONE language for the page, whichever key wrote it — so the
    // default store, read afterwards, is seeded by it (and persists it)
    expect(href()).toBe("https://docs.example.com/api/create-widget?lang=java");
    expect(sdkLanguageStore().get()).toBe("java");
    expect(storage.get(SDK_LANGUAGE_STORAGE_KEY)).toBe("java");
  });
});

describe("useSdkLanguageStore", () => {
  function Probe() {
    const [language] = useSdkLanguageStore();
    return createElement("span", null, language ?? "none");
  }

  it("the server snapshot is null even when a language is stored — no hydration mismatch", () => {
    installWindow("https://docs.example.com/api/create-widget?lang=python");
    expect(renderToString(createElement(Probe))).toBe("<span>none</span>");
  });
});
