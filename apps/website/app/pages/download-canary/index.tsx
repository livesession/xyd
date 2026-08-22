import { useEffect, useState } from "react";

import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { IconMac } from "~/icons/Mac";
import { IconLinux } from "~/icons/Linux";
import { IconWindows } from "~/icons/Windows";

// The GitHub repo the canary binaries are published to.
export const CANARY_REPO = "livesession/xyd";

// Resolved once at build time by the route loader (see routes/download-canary.tsx).
// `assets` maps a release-asset name (e.g. "xyd-darwin-arm64") to its download URL.
export interface CanaryReleaseData {
  tag: string;
  htmlUrl: string;
  publishedAt: string | null;
  assets: Record<string, string>;
}

type OsId = "mac" | "linux" | "windows";

interface ArchOption {
  label: string;
  /** Release-asset name, or null when the binary is not built yet. */
  asset: string | null;
}

interface PlatformConfig {
  id: OsId;
  name: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  /** The recommended (headline) architecture, or null when nothing ships yet. */
  primary: { label: string; sub: string; asset: string } | null;
  arches: ArchOption[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "mac",
    name: "Mac",
    Icon: IconMac,
    primary: {
      label: "Apple Silicon",
      sub: "macOS · M1 and newer",
      asset: "xyd-darwin-arm64",
    },
    arches: [
      { label: "Apple Silicon (arm64)", asset: "xyd-darwin-arm64" },
      { label: "Intel (x64)", asset: null },
    ],
  },
  {
    id: "linux",
    name: "Linux",
    Icon: IconLinux,
    primary: {
      label: "x64",
      sub: "glibc · x86-64",
      asset: "xyd-linux-x64",
    },
    arches: [
      { label: "x64", asset: "xyd-linux-x64" },
      { label: "ARM64", asset: "xyd-linux-arm64" },
    ],
  },
  {
    id: "windows",
    name: "Windows",
    Icon: IconWindows,
    primary: null,
    arches: [
      { label: "x64", asset: null },
      { label: "ARM64", asset: null },
    ],
  },
];

// Resolve an asset's download URL from the loader data. Returns null when the
// resolved release does not carry that binary — callers render a "soon" state
// rather than a fabricated (and 404-ing) link.
function assetUrl(data: CanaryReleaseData, name: string): string | null {
  return data.assets[name] ?? null;
}

// Best-effort client-side platform hint so we can flag the visitor's OS.
function detectOs(): OsId | null {
  if (typeof navigator === "undefined") return null;
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  if (ua.includes("linux") || ua.includes("android")) return "linux";
  return null;
}

const DownloadArrow = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 14l-7 7m0 0l-7-7m7 7V3"
    />
  </svg>
);

function ArchChip({ arch, data }: { arch: ArchOption; data: CanaryReleaseData }) {
  const url = arch.asset ? assetUrl(data, arch.asset) : null;
  if (!url) {
    return (
      <span className="inline-flex cursor-not-allowed items-center rounded-md border border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500">
        {arch.label} · soon
      </span>
    );
  }
  return (
    <a
      href={url}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      {arch.label}
      <DownloadArrow className="h-3.5 w-3.5 text-gray-400" />
    </a>
  );
}

function PlatformColumn({
  platform,
  data,
  recommended,
}: {
  platform: PlatformConfig;
  data: CanaryReleaseData;
  recommended: boolean;
}) {
  const { Icon, primary, arches } = platform;
  const primaryUrl = primary ? assetUrl(data, primary.asset) : null;

  return (
    <div
      className={`relative flex flex-col px-8 py-12 sm:px-10 sm:py-16 ${
        recommended ? "bg-purple-50" : ""
      }`}
    >
      {recommended && (
        <span className="absolute right-5 top-5 inline-flex items-center rounded-full bg-purple-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Your device
        </span>
      )}

      <Icon className="h-10 w-10 text-gray-900" fill="currentColor" />
      <h2 className="mt-6 text-2xl font-normal text-gray-900">{platform.name}</h2>

      {primary && primaryUrl ? (
        <a
          href={primaryUrl}
          className="group mt-8 flex flex-col items-center justify-center rounded-lg border border-gray-200 px-6 py-6 text-center text-gray-900 transition-all duration-300 ease-out hover:border-transparent hover:bg-[#0a2540] hover:text-white hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <DownloadArrow className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-y-0.5" />
            {primary.label}
            <span className="rounded bg-gray-900/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-600 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white">
              CANARY
            </span>
          </span>
          <span className="mt-1 text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-300">{primary.sub}</span>
        </a>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-6 py-6 text-center">
          <span className="text-base font-semibold text-gray-600">Coming soon</span>
          <span className="mt-1 text-xs text-gray-600">Native binary in the works</span>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Architectures
        </p>
        <div className="flex flex-wrap gap-2">
          {arches.map((arch) => (
            <ArchChip key={arch.label} arch={arch} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageDownloadCanary({ data }: { data: CanaryReleaseData }) {
  const [os, setOs] = useState<OsId | null>(null);

  useEffect(() => {
    setOs(detectOs());
  }, []);

  return (
    // `download-canary-bg` paints the larger 40px dot grid on the wrapper itself
    // (see app.css) so it is correct in the prerendered HTML — no post-hydration flash.
    <div className="download-canary-bg flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-6 pb-16 pt-40 sm:pt-48 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl font-light tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Download xyd Canary
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
              The node-free, self-contained binary rewritten in Rust.
            </p>
          </div>

          {/* Platform grid */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-white/40 backdrop-blur-sm">
            <div className="grid divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
              {PLATFORMS.map((platform) => (
                <PlatformColumn
                  key={platform.id}
                  platform={platform}
                  data={data}
                  recommended={os === platform.id}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
