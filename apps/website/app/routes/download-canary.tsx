import type { Route } from "./+types/download-canary";

import {
  PageDownloadCanary,
  CANARY_REPO,
  type CanaryReleaseData,
} from "../pages/download-canary";

// Last-known canary tag. Used only as a graceful fallback so a build never
// breaks when the GitHub API is unreachable (offline / rate-limited). The live
// value is resolved by the loader below at build/prerender time.
const FALLBACK_TAG = "canary-2433757";

const FALLBACK_ASSET_NAMES = [
  "xyd-darwin-arm64",
  "xyd-linux-x64",
  "xyd-linux-arm64",
];

function fallbackData(): CanaryReleaseData {
  const base = `https://github.com/${CANARY_REPO}/releases/download/${FALLBACK_TAG}`;
  return {
    tag: FALLBACK_TAG,
    htmlUrl: `https://github.com/${CANARY_REPO}/releases/tag/${FALLBACK_TAG}`,
    publishedAt: null,
    assets: Object.fromEntries(
      FALLBACK_ASSET_NAMES.map((name) => [name, `${base}/${name}`]),
    ),
  };
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
  assets: GithubAsset[];
}

// Runs at build time (the site is prerendered), so the newest canary release is
// baked into the static HTML. Falls back to the last-known tag on any failure.
export async function loader(): Promise<CanaryReleaseData> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${CANARY_REPO}/releases?per_page=30`,
      {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "xyd-website",
        },
      },
    );
    if (!res.ok) throw new Error(`github api ${res.status}`);

    const releases = (await res.json()) as GithubRelease[];
    const canary = releases.find(
      (r) => r.prerelease && typeof r.tag_name === "string" && r.tag_name.startsWith("canary-"),
    );
    if (!canary) throw new Error("no canary release found");

    const assets = Object.fromEntries(
      (canary.assets ?? []).map((a) => [a.name, a.browser_download_url]),
    );

    // Never bake a partial release into the static site: if the newest canary is
    // missing any expected binary (e.g. an in-progress asset upload race), fall
    // back to the last-known-good set instead of shipping a dead download link.
    if (!FALLBACK_ASSET_NAMES.every((name) => assets[name])) {
      throw new Error("canary release missing expected assets");
    }

    return {
      tag: canary.tag_name,
      htmlUrl: canary.html_url,
      publishedAt: canary.published_at ?? null,
      assets,
    };
  } catch {
    return fallbackData();
  }
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Download xyd Canary — the Rust-native binary" },
    {
      name: "description",
      content:
        "Download the node-free, Rust-native xyd binary from the canary channel. Native builds for macOS (Apple Silicon) and Linux (x64, ARM64).",
    },
    { property: "og:title", content: "Download xyd Canary" },
    {
      property: "og:description",
      content:
        "The new Rust-native xyd binary — early access via the canary channel.",
    },
  ];
}

export default function DownloadCanaryRoute({ loaderData }: Route.ComponentProps) {
  return <PageDownloadCanary data={loaderData} />;
}
