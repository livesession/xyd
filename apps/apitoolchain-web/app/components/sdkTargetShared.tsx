import type {
  GitProvider,
  PackageRegistry,
  RegistryConnection,
  Release,
  RepoConnection,
  SdkTarget,
  TargetVersion,
} from "~/data";

/**
 * Shared state for the SDK-target tab tree. The layout
 * (`sdks.$sdkId.targets.$targetId.tsx`) loads it once and provides it via
 * `<Outlet context>`; each tab reads it with `useOutletContext`.
 */
export type SdkTargetContext = {
  target: SdkTarget;
  sdkId: string;
  apiName: string;
  /** `/sdks/:sdkId/targets/:targetId` — the tab route base + action path. */
  base: string;
  /** Friendly language label (e.g. "Go"). */
  label: string;
  /** The target build is ready (SDK generated). */
  ready: boolean;
  versions: TargetVersion[];
  connections: RepoConnection[];
  releasesByConn: Record<string, Release[]>;
  registries: PackageRegistry[];
  registryConnections: RegistryConnection[];
  providers: GitProvider[];
  /** Open the shared "Connect a repo" modal (owned by the layout). */
  openConnect: () => void;
  /** Open the shared "Connect a registry" modal (owned by the layout). */
  openPublish: () => void;
};
