import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Folder-based dev seed profiles. Each profile is a directory under
 * `packages/apitoolchain-dev/profiles/<id>/` containing a `profile.json`
 * manifest (and optionally its own `specs/*.yaml`). The plugin auto-discovers
 * them at dev-server start — drop in a new folder and it shows up in the picker.
 * Applied by `apply-profile.ts` against the live services (specs land in
 * storage, SDKs generate, repos are created in the local Gitea).
 */

export interface ProfileApi {
  name: string;
  ns: string;
  /**
   * How to resolve the OpenAPI spec, in order:
   *  - inline spec text (contains a newline),
   *  - a path (starts with "." or contains "/") → relative to the profile dir,
   *  - a shared key (e.g. "livesession") → a vendored app spec.
   */
  spec: string;
  source?: string;
  /**
   * Extra version labels to register the same spec under, in ascending order
   * (e.g. ["1.0.0", "1.1.0", "2.0.0"]) — gives the API a real version history.
   * The last entry becomes the current version. Omit for a single version
   * derived from the spec's own `info.version`.
   */
  versions?: string[];
}

export interface ProfileSdk {
  /** The `name` of a ProfileApi in the same profile to generate an SDK for. */
  api: string;
  name?: string;
  /** Language targets, e.g. ["node", "go", "python"]. */
  languages: string[];
}

/**
 * A namespace the profile owns. Namespaces group registry entries + SDKs and
 * are globally-unique slugs (`/@{id}/…`). A profile need only declare STANDALONE
 * namespaces here — every `apis[].ns` is derived automatically (see
 * resolveProfileNamespaces), so an API's namespace always exists.
 */
export interface ProfileNamespace {
  id: string;
  name?: string;
  description?: string;
}

/** An extra project seeded into the dev org (beyond the base `Default`). */
export interface ProfileProject {
  name: string;
}

/** A teammate seeded into the dev org's members list. Password-less (they
 * appear in the members UI but the dev owner is the only login). */
export interface ProfileMember {
  email: string;
  name?: string;
  role?: string;
}

/** The on-disk `profile.json` shape. */
export interface ProfileManifest {
  name?: string;
  description?: string;
  order?: number;
  apis?: ProfileApi[];
  sdks?: ProfileSdk[];
  /** Standalone namespaces beyond those implied by `apis[].ns`. */
  namespaces?: ProfileNamespace[];
  projects?: ProfileProject[];
  members?: ProfileMember[];
  connect?: boolean;
}

/** A loaded profile (manifest + its folder id/path). */
export interface DevProfile {
  id: string;
  /** Absolute path to the profile folder (resolves relative spec files). */
  dir: string;
  name: string;
  description: string;
  order: number;
  apis: ProfileApi[];
  sdks: ProfileSdk[];
  /** Effective namespaces: derived from `apis[].ns` + declared standalone ones. */
  namespaces: ProfileNamespace[];
  projects: ProfileProject[];
  members: ProfileMember[];
  connect: boolean;
}

/** Normalize any input into a valid, DNS-ish namespace slug (mirrors the web
 * app's `namespaceSlug`). */
const nsSlug = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Effective namespaces for a profile: one per distinct `apis[].ns` (so a
 * registered API's namespace always exists), plus any explicitly-declared
 * standalone namespaces. Explicit entries win on id collision — they can set a
 * nicer name/description; an explicit entry with no description inherits the
 * API-derived one. Order: API-derived first, then extras.
 */
export function resolveProfileNamespaces(
  m: ProfileManifest,
): ProfileNamespace[] {
  const byId = new Map<string, ProfileNamespace>();
  for (const api of m.apis ?? []) {
    const id = nsSlug(api.ns);
    if (!id || byId.has(id)) continue;
    byId.set(id, { id, name: id, description: api.name });
  }
  for (const ns of m.namespaces ?? []) {
    const id = nsSlug(ns.id);
    if (!id) continue;
    const prior = byId.get(id);
    byId.set(id, {
      id,
      name: ns.name?.trim() || prior?.name || id,
      description: ns.description?.trim() || prior?.description,
    });
  }
  return [...byId.values()];
}

/**
 * Load every `<profilesDir>/<id>/profile.json`. Folders starting with "." or
 * "_" are skipped (reserved for shared assets). Sorted by `order` then id.
 */
export function loadProfiles(profilesDir: string): DevProfile[] {
  if (!existsSync(profilesDir)) return [];
  const out: DevProfile[] = [];
  for (const id of readdirSync(profilesDir)) {
    if (id.startsWith(".") || id.startsWith("_")) continue;
    const dir = resolve(profilesDir, id);
    const manifestPath = resolve(dir, "profile.json");
    if (!existsSync(manifestPath)) continue;
    let m: ProfileManifest;
    try {
      m = JSON.parse(readFileSync(manifestPath, "utf8")) as ProfileManifest;
    } catch (e) {
      throw new Error(
        `dev profile "${id}": invalid profile.json — ${(e as Error).message}`,
      );
    }
    out.push({
      id,
      dir,
      name: m.name ?? id,
      description: m.description ?? "",
      order: m.order ?? 999,
      apis: m.apis ?? [],
      sdks: m.sdks ?? [],
      namespaces: resolveProfileNamespaces(m),
      projects: m.projects ?? [],
      members: m.members ?? [],
      connect: m.connect ?? false,
    });
  }
  out.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return out;
}

/** A one-line summary of what a profile contains (for the picker UI). */
export function profileSummary(p: DevProfile): string {
  const parts: string[] = [];
  if (p.apis.length)
    parts.push(`${p.apis.length} API${p.apis.length === 1 ? "" : "s"}`);
  if (p.namespaces.length)
    parts.push(
      `${p.namespaces.length} namespace${p.namespaces.length === 1 ? "" : "s"}`,
    );
  const targets = p.sdks.reduce((n, s) => n + s.languages.length, 0);
  if (targets) parts.push(`${targets} SDK target${targets === 1 ? "" : "s"}`);
  if (p.projects.length)
    parts.push(
      `${p.projects.length} project${p.projects.length === 1 ? "" : "s"}`,
    );
  if (p.members.length)
    parts.push(
      `${p.members.length} member${p.members.length === 1 ? "" : "s"}`,
    );
  if (p.connect) parts.push("connected to Gitea");
  return parts.join(" · ") || "Empty";
}
