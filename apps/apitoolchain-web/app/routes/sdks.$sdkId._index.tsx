import {
  Button,
  type Column,
  DescriptionList,
  EmptyState,
  Mono,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import type {
  SdkDetailContext,
  SdkOverviewTargetRow,
} from "~/components/sdkDetailShared";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export default function SdkOverviewTab() {
  const { sdk, apiName, base, targetSummaries, openAdd } =
    useOutletContext<SdkDetailContext>();

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
      key: "package",
      header: "Package",
      width: "wide",
      render: (t) => <Mono>{t.packageName || "—"}</Mono>,
    },
    {
      key: "version",
      header: "Latest version",
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
    <div className="flex flex-col gap-8">
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
          { label: "Namespace", value: sdk.namespace },
          { label: "Created", value: sdk.createdAt },
        ]}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">Targets</div>
          <Button variant="secondary" icon="plus" onClick={openAdd}>
            Add target
          </Button>
        </div>
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
    </div>
  );
}
