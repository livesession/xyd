#!/usr/bin/env node
/**
 * Generate release notes with @handles using GitHub REST.
 * No dependencies. Works on Node 18+ (global fetch).
 *
 * Usage:
 *   node scripts/generate-release-notes.mjs <version> [previous_tag]
 * Env:
 *   GITHUB_TOKEN (repo scope; Actions' default token works)
 */
import { execSync } from "node:child_process";
import process from "node:process";

const VERSION = process.argv[2] || "";
const PREVIOUS_TAG_ARG = process.argv[3] || "";
const TOKEN = process.env.GITHUB_TOKEN;

if (!VERSION) { console.error("❌ Provide version"); process.exit(1); }
if (!TOKEN) { console.error("❌ Set GITHUB_TOKEN"); process.exit(1); }

const sh = (cmd) =>
  execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();

// Detect owner/repo from origin (supports .git or not)
const remote = (() => { try { return sh("git remote get-url origin"); } catch { return ""; } })();
if (!remote) { console.error("❌ No 'origin' remote"); process.exit(1); }

let OWNER = "", REPO = "";
{
  const ssh = remote.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  const https = remote.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (ssh) { OWNER = ssh[1]; REPO = ssh[2]; }
  else if (https) { OWNER = https[1]; REPO = https[2]; }
  else { console.error(`❌ Not a GitHub remote: ${remote}`); process.exit(1); }
}

// Tag schema
function detectSchema(v) {
  if (/^v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(v)) return { schema: "v*", prefix: "v" };
  if (/^[A-Za-z0-9-]+\/[A-Za-z0-9-]+@\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(v)) {
    const pkg = v.replace(/@.*$/, "");
    return { schema: `${pkg}@*`, prefix: `${pkg}@` };
  }
  if (/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(v)) return { schema: v, prefix: "" };
  return { schema: v, prefix: "" };
}
const { schema: TAG_SCHEMA, prefix: TAG_PREFIX } = detectSchema(VERSION);

// Previous tag detection
const firstSha = () => { try { return sh("git rev-list --max-parents=0 HEAD").split("\n")[0]; } catch { return ""; } };
function latestMatchingTag(exclude) {
  const all = sh("git tag --sort=-version:refname").split("\n").filter(Boolean);
  
  // Check if current version is a stable version (no pre-release suffix)
  const isStableVersion = !VERSION.includes('-');
  
  if (TAG_SCHEMA === "v*") {
    if (isStableVersion) {
      // For stable versions, only consider other stable versions
      return all.find(t => /^v[0-9]/.test(t) && !t.includes('-') && t !== exclude) || "";
    } else {
      // For pre-release versions, consider all versions
      return all.find(t => /^v[0-9]/.test(t) && t !== exclude) || "";
    }
  }
  
  if (TAG_SCHEMA.includes("@")) {
    if (isStableVersion) {
      // For stable versions, only consider other stable versions
      return all.find(t => t.startsWith(TAG_PREFIX) && !t.includes('-') && t !== exclude) || "";
    } else {
      // For pre-release versions, consider all versions
      return all.find(t => t.startsWith(TAG_PREFIX) && t !== exclude) || "";
    }
  }
  
  const mm = (VERSION.match(/^(\d+\.\d+)\./) || [, ""])[1];
  if (mm) {
    if (isStableVersion) {
      // For stable versions, only consider other stable versions
      return all.find(t => t.startsWith(`${mm}.`) && !t.includes('-') && t !== exclude) || "";
    } else {
      // For pre-release versions, consider all versions
      return all.find(t => t.startsWith(`${mm}.`) && t !== exclude) || "";
    }
  }
  
  return "";
}
const PREVIOUS_TAG = PREVIOUS_TAG_ARG || latestMatchingTag(VERSION);
const BASE = PREVIOUS_TAG || firstSha();
const HEAD = "HEAD";
if (!BASE) { console.error("❌ Could not determine base ref"); process.exit(1); }

// GitHub REST (no deps)
async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "release-notes",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}
async function commitsBetween(base, head) {
  const data = await gh(`/repos/${OWNER}/${REPO}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
  return data.commits.map(c => ({
    sha: c.sha,
    url: c.html_url,
    msg: c.commit.message,
    login: c.author?.login || null,
  }));
}
async function prAuthorLogin(sha) {
  try {
    const data = await gh(`/repos/${OWNER}/${REPO}/commits/${sha}/pulls`);
    return data?.[0]?.user?.login || null;
  } catch { return null; }
}

// Conventional parse
const COMMON_ORDER = ["feat","fix","perf","refactor","docs","chore","test","build","ci","style","revert"];
const TITLE_MAP = {
  feat: "## Features",
  fix: "## Bug Fixes",
  perf: "## Performance",
  refactor: "## Refactors",
  docs: "## Documentation",
  chore: "## Chores",
  test: "## Tests",
  build: "## Build",
  ci: "## CI",
  style: "## Style",
  revert: "## Reverts",
};
const toTitle = (type) => TITLE_MAP[type] || `## ${type.charAt(0).toUpperCase()}${type.slice(1)}`;
const clean = (s) => s.trim().replace(/\s+/g, " ");
function parseHeader(m) {
  const first = m.split("\n")[0];
  const r = first.match(/^(\w+)(?:\([^)]*\))?(!)?:\s*(.+)$/);
  if (!r) return { matched: false, type: "other", breaking: false, subject: first.trim() };
  const [, type, bang, subject] = r;
  return { matched: true, type: type.toLowerCase(), breaking: !!bang, subject: subject.trim() };
}

(async () => {
  const commits = await commitsBetween(BASE, HEAD);

  const items = [];
  for (const c of commits) {
    const parsed = parseHeader(c.msg);
    let login = c.login || await prAuthorLogin(c.sha);

    // If it matched Conventional Commits, we honor its type as section.
    // Otherwise dump to "other".
    const bucketKey = parsed.matched ? parsed.type : "other";

    items.push({
      bucketKey,
      matched: parsed.matched,
      breaking: parsed.breaking || /(^|\n)BREAKING CHANGE:/i.test(c.msg),
      subject: clean(parsed.subject),
      handle: login ? `@${login}` : "unknown",
      sha: c.sha,
      url: c.url,
    });
  }

  // Highlights (any breaking)
  const HIGHLIGHTS = items.filter(i => i.breaking || /\b(major|breaking)\b/i.test(i.subject));

  // Build buckets: common types in fixed order, then any extra matched types A→Z, then "other"
  const dynamicTypes = Array.from(new Set(items
    .filter(i => i.bucketKey !== "other")
    .map(i => i.bucketKey)
    .filter(t => !COMMON_ORDER.includes(t))
  )).sort();

  const sectionOrder = [...COMMON_ORDER.filter(t => items.some(i => i.bucketKey === t)), ...dynamicTypes, "other"];

  const buckets = new Map(sectionOrder.map(k => [k, []]));
  for (const it of items) {
    if (!buckets.has(it.bucketKey)) buckets.set(it.bucketKey, []);
    buckets.get(it.bucketKey).push(it);
  }

  // Emit markdown
  const out = [];
  out.push(`## 🚀 Release ${VERSION}`);

  if (HIGHLIGHTS.length) {
    out.push("", "## Highlights");
    for (const b of HIGHLIGHTS) {
      out.push(`- ${b.subject} by ${b.handle} ([${b.sha.slice(0,7)}](${b.url}))`);
    }
  }

  for (const key of sectionOrder) {
    const arr = buckets.get(key) || [];
    if (!arr.length) continue;
    const title = key === "other" ? "## Other Changes" : toTitle(key);
    out.push("", title);
    for (const i of arr) {
      out.push(`- ${i.subject} by ${i.handle} ([${i.sha.slice(0,7)}](${i.url}))`);
    }
  }

  console.log(out.join("\n"));
})().catch(err => { console.error("❌ Failed:", err.message || err); process.exit(1); });
