import type { Config } from "@react-router/dev/config";

// ssr + prerender: the two-vite-build + prerender path (mirrors apps/website).
export default { ssr: true, prerender: true } satisfies Config;
