import type {
  ApiVersion,
  BuildStatus,
  DistTag,
  Sdk,
  SdkLanguage,
} from "~/data";

/** One (target × version) row with a search blob for the free-text filter. */
export type SdkTargetVersionRow = {
  id: string;
  targetId: string;
  /** The target's stored display title (falls back to a derived name). */
  name: string;
  language: SdkLanguage;
  packageName: string;
  /** The parent SDK's own version (constant across the table; here for the facet). */
  sdkVersion: string;
  version: string;
  /** The API spec version the target was built from (decoupled from `version`). */
  apiVersion: string;
  status: BuildStatus;
  /** The DISPLAYED status (`sdkBuildStatus`: built / published / building / …) —
   * what the pill shows AND what the Status facet filters on; the raw `status`
   * ("ready") is never surfaced. */
  displayStatus: string;
  publishedAt: string;
  /** Dist-tags inherited from the parent spec for this version. */
  tags: string[];
  search: string;
};

/** One general language target for the Overview list (its latest version). */
export type SdkOverviewTargetRow = {
  id: string;
  /** The target's stored display title (falls back to a derived name). */
  name: string;
  language: SdkLanguage;
  packageName: string;
  latestVersion: string;
  /** The API spec version this target was built from (decoupled from the
   * package version above). */
  apiVersion: string;
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
  /** The parent API's spec versions (what the SDK can be built from). */
  apiVersions: ApiVersion[];
  /** The API's dist-tags — surfaced per selected version on the overview. */
  apiDistTags: DistTag[];
  /** The API's current spec version — the default to build from. */
  currentApiVersion: string;
  /** Open the shared "Add target" modal (owned by the layout). */
  openAdd: () => void;
  /** Open the shared "Build" modal (owned by the layout). */
  openBuild: () => void;
};
