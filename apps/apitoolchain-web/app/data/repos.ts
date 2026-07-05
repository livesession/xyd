/**
 * Connected source repositories — the eventual sync origin for the registry
 * (CI/CD or CLI push). Scaffolding for now: a client-side (localStorage) store,
 * NOT yet a backend concept or a real GitHub connection. The registry backend
 * stays repo-agnostic; this only powers the "Import from repo" UX + the
 * `/settings/connections` config page. SSR-safe (guards `window`).
 */

export interface Repo {
  id: string;
  /** Display name, e.g. "acme/petstore". */
  name: string;
  /** GitHub URL or owner/repo. */
  url: string;
}

const KEY = "apitoolchain.repos";

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/[^a-z0-9/]+/g, "-")
      .replace(/^-+|-+$/g, "") || "repo"
  );
}

export function listRepos(): Repo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Repo[]) : [];
  } catch {
    return [];
  }
}

function save(repos: Repo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(repos));
}

/** Add (or replace by id) a connected repo. Returns the full list. */
export function addRepo(input: { url: string; name?: string }): Repo[] {
  const url = input.url.trim();
  const id = slug(url);
  const name = (input.name?.trim() || id).replace(/^github\.com\//, "");
  const repo: Repo = { id, name, url };
  const next = [...listRepos().filter((r) => r.id !== id), repo];
  save(next);
  return next;
}

export function removeRepo(id: string): Repo[] {
  const next = listRepos().filter((r) => r.id !== id);
  save(next);
  return next;
}
