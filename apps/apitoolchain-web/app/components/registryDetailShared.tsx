import { Badge } from "@apitoolchain/design-system";
import type {
  DocsProject,
  McpServer,
  RegistryEntry,
  Release,
  RepoConnection,
  SdkTarget,
} from "~/data";

/** Coloured pills for a version's dist-tags (`latest` reads as success). */
export function TagBadges({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-subtle">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t} tone={t === "latest" ? "success" : "info"}>
          @{t}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Shared state for the registry-detail tab tree. The parent layout
 * (`registry.detail.tsx`) loads everything once and provides this via
 * `<Outlet context>`; each tab route reads it with `useOutletContext`.
 */
export type RegistryDetailContext = {
  api: RegistryEntry;
  isSchema: boolean;
  /** `/registry/:apiId` — the tab route base. */
  base: string;
  sdks: SdkTarget[];
  docs: DocsProject[];
  mcp: McpServer[];
  connections: RepoConnection[];
  releasesByConn: Record<string, Release[]>;
  /** version → the dist-tags pointing at it. */
  tagsByVersion: Map<string, string[]>;
  /** Open the shared "Connect a repo" modal (owned by the parent). */
  openConnect: () => void;
  /** Open the shared "Generate SDKs" modal (owned by the parent). */
  openGen: () => void;
};
