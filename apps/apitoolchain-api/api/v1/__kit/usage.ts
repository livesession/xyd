import type {
  UsageRange,
  UsageSeries,
} from "../../openapi/v1/src/generated/models/all/apitoolchain";

const RANGE_POINTS: Record<string, number> = {
  "24h": 24,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const SERIES = [
  {
    id: "api_requests",
    label: "API requests",
    unit: "requests",
    base: 4200,
    amp: 1400,
  },
  {
    id: "sdk_downloads",
    label: "SDK downloads",
    unit: "downloads",
    base: 320,
    amp: 180,
  },
  { id: "mcp_calls", label: "MCP calls", unit: "calls", base: 900, amp: 500 },
  {
    id: "docs_views",
    label: "Docs views",
    unit: "views",
    base: 1500,
    amp: 700,
  },
];

/**
 * Deterministic (SSR-stable, no Date.now/random) synthetic usage series — the
 * MVP stand-in for real usage-event aggregation. Point count = range buckets.
 */
export function usageSeries(range: string): UsageSeries[] {
  const n = RANGE_POINTS[range] ?? 7;
  const r = (RANGE_POINTS[range] ? range : "7d") as UsageRange;
  return SERIES.map((s, si) => {
    const points = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.max(
        0,
        Math.round(s.base + s.amp * Math.sin((i / n) * Math.PI * 2 + si)),
      );
      points.push({ t: String(i), value: v });
      total += v;
    }
    return { id: s.id, label: s.label, unit: s.unit, total, range: r, points };
  });
}
