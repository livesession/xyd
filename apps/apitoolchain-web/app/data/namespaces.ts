/**
 * Namespaces group registry entries (`/@{namespace}/apis/{id}`) and SDKs.
 *
 * INVARIANT: a namespace slug is UNIQUE ACROSS THE ENTIRE apitoolchain database
 * — not per-project. Two entries can never share `{namespace, id}` collisions
 * because the namespace itself is globally reserved. This store enforces that
 * uniqueness on the client; the real backend enforces it authoritatively.
 *
 * Scaffolding for now: a client-side (localStorage) store, NOT yet a backend
 * resource. It seeds the OpenAPI-import namespace picker and powers the
 * `/settings/namespaces` management page. SSR-safe (guards `window`).
 *
 * Starts EMPTY — namespaces are created by the user, or (in the dev stack)
 * reseeded per profile by the dev overlay, which writes this exact key/shape on
 * profile apply. No hardcoded defaults, so "scratch" shows none.
 */

export interface Namespace {
  /** Globally-unique slug used in registry URLs (`/@{id}/apis/…`). */
  id: string;
  /** Display name (defaults to the slug). */
  name: string;
  description?: string;
}

const KEY = "apitoolchain.namespaces";

/** No hardcoded namespaces — the store starts empty and is filled by the user
 * or reseeded per dev profile (see the file header). */
const DEFAULTS: Namespace[] = [];

/** Normalize any input into a valid, DNS-ish namespace slug. */
export function namespaceSlug(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || ""
  );
}

export function listNamespaces(): Namespace[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    // Absent key → first run: seed defaults. An explicit `[]` (user removed all)
    // is respected and NOT re-seeded.
    if (raw == null) {
      save(DEFAULTS);
      return DEFAULTS;
    }
    return JSON.parse(raw) as Namespace[];
  } catch {
    return DEFAULTS;
  }
}

function save(namespaces: Namespace[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(namespaces));
}

export type AddNamespaceResult =
  | { ok: true; namespaces: Namespace[] }
  | { ok: false; message: string };

/**
 * Create a namespace. Fails if the slug is already taken — namespaces are
 * globally unique (see the invariant above).
 */
export function addNamespace(input: {
  name: string;
  description?: string;
}): AddNamespaceResult {
  const id = namespaceSlug(input.name);
  if (!id) {
    return { ok: false, message: "Enter a valid namespace (a-z, 0-9, -)." };
  }
  const current = listNamespaces();
  if (current.some((n) => n.id === id)) {
    return { ok: false, message: `Namespace "${id}" is already taken.` };
  }
  const next = [
    ...current,
    { id, name: id, description: input.description?.trim() || undefined },
  ];
  save(next);
  return { ok: true, namespaces: next };
}

export function removeNamespace(id: string): Namespace[] {
  const next = listNamespaces().filter((n) => n.id !== id);
  save(next);
  return next;
}
