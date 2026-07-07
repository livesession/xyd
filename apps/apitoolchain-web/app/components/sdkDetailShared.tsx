import type { BuildStatus, Sdk, SdkLanguage } from "~/data";

/** One (target × version) row with a search blob for the free-text filter. */
export type SdkTargetVersionRow = {
  id: string;
  targetId: string;
  language: SdkLanguage;
  packageName: string;
  version: string;
  status: BuildStatus;
  publishedAt: string;
  /** Dist-tags inherited from the parent spec for this version. */
  tags: string[];
  search: string;
};

/** One general language target for the Overview list (its latest version). */
export type SdkOverviewTargetRow = {
  id: string;
  language: SdkLanguage;
  packageName: string;
  latestVersion: string;
  status: BuildStatus;
  lastPublishedAt?: string;
  registryUrl?: string;
};

/**
 * Shared state for the SDK-detail tab tree. The layout (`sdks.$sdkId.tsx`) loads
 * it once and provides it via `<Outlet context>`; each tab reads it with
 * `useOutletContext`.
 */
export type SdkDetailContext = {
  sdk: Sdk;
  apiName: string;
  /** `/sdks/:sdkId` — the tab route base. */
  base: string;
  rows: SdkTargetVersionRow[];
  targetSummaries: SdkOverviewTargetRow[];
  /** Open the shared "Add target" modal (owned by the layout). */
  openAdd: () => void;
};
