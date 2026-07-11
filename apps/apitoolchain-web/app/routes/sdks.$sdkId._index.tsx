import {
  type Column,
  ContentSection,
  ContentSections,
  DescriptionList,
  Dropdown,
  EmptyState,
  Mono,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import { TagBadges } from "~/components/registryDetailShared";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import type {
  SdkDetailContext,
  SdkOverviewTargetRow,
} from "~/components/sdkDetailShared";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export default function SdkOverviewTab() {
  const { sdk, apiName, base, targetSummaries, apiVersions, apiDistTags } =
    useOutletContext<SdkDetailContext>();

  // The SDK's OWN version drives the dropdown (registry-style) — decoupled from
  // the API spec version, which is shown as a detail below. Today there's a
  // single SDK version; the upcoming "builds" section will list more here.
  const sdkVersions = [sdk.version];
  const [versionSel, setVersionSel] = useState<string | null>(null);
  const shownSdkVersion =
    sdkVersions.find((v) => v === versionSel) ?? sdk.version;
  // The API spec version this SDK was built from — the parent API's current
  // version (becomes per-SDK-version once builds land).
  const apiVersion = apiVersions.find((v) => v.current) ?? apiVersions[0];
  const tagsFor = (version: string) =>
    apiDistTags.filter((t) => t.version === version).map((t) => t.tag);

  const overviewTargetCols: Column<SdkOverviewTargetRow>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (t) => (
        <span className="flex items-center gap-2">
          <SdkLangIcon language={t.language} />
          <span className="text-body">{SDK_LANG_LABEL[t.language]}</span>
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      width: "wide",
      render: (t) => <span className="text-body">{t.name}</span>,
    },
    {
      key: "apiVersion",
      // nowrap + a wider column so the two-word header stays on one line (at
      // `sm` it wrapped, growing the header row's height).
      header: <span className="whitespace-nowrap">API version</span>,
      width: "md",
      render: (t) => (
        <span className="text-subtle">{formatVersion(t.apiVersion)}</span>
      ),
    },
    {
      key: "version",
      header: "Version",
      width: "sm",
      render: (t) => (
        <span className="text-body">{formatVersion(t.latestVersion)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (t) => <StatusPill status={sdkBuildStatus(t)} />,
    },
  ];

  return (
    <ContentSections>
      <ContentSection>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-subtle">Version</span>
            <Dropdown
              variant="select"
              icon="tags-outline"
              label={formatVersion(shownSdkVersion)}
              items={sdkVersions.map((v) => ({
                key: v,
                label: `${formatVersion(v)}${v === sdk.version ? " · current" : ""}`,
                active: v === shownSdkVersion,
                onSelect: () => setVersionSel(v),
              }))}
            />
          </div>
          <DescriptionList
            items={[
              {
                label: "API",
                value: (
                  <RouterLink
                    href={`/registry/${sdk.apiId}`}
                    className="text-blue no-underline hover:underline"
                  >
                    {apiName}
                  </RouterLink>
                ),
              },
              {
                label: "API version",
                value: (
                  <span className="text-body">
                    {formatVersion(apiVersion?.version)}
                  </span>
                ),
              },
              { label: "Namespace", value: sdk.namespace },
              {
                label: "Dist-tag",
                value: <TagBadges tags={tagsFor(apiVersion?.version ?? "")} />,
              },
              { label: "Registry", value: <Mono>{sdk.registryRef}</Mono> },
              {
                label: "API updated",
                value: apiVersion?.updatedAt ?? "—",
              },
              { label: "Created", value: sdk.createdAt },
            ]}
          />
        </div>
      </ContentSection>

      <ContentSection divided>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-ink">Targets</div>
          {targetSummaries.length === 0 ? (
            <EmptyState
              icon="sdk"
              title="No targets yet"
              description="Add a language target to generate a client library."
            />
          ) : (
            <Table
              columns={overviewTargetCols}
              rows={targetSummaries}
              getRowKey={(t) => t.id}
              rowHref={(t) => `${base}/targets/${t.id}`}
              linkComponent={RouterLink}
            />
          )}
        </div>
      </ContentSection>
    </ContentSections>
  );
}
