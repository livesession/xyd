import {
  Badge,
  Button,
  type Column,
  EmptyState,
  Mono,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import type { RegistryDetailContext } from "~/components/registryDetailShared";
import type { SdkTarget } from "~/data";
import { sdkBuildStatus } from "~/lib/sdkStatus";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistrySdksTab() {
  const { sdks, openGen } = useOutletContext<RegistryDetailContext>();

  const sdkCols: Column<SdkTarget>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (t) => (
        <Badge tone="neutral" icon="sdk">
          {t.language}
        </Badge>
      ),
    },
    {
      key: "packageName",
      header: "Package",
      width: "auto",
      render: (t) => <Mono>{t.packageName}</Mono>,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      align: "right",
      render: (t) => <StatusPill status={sdkBuildStatus(t)} />,
    },
  ];

  if (sdks.length === 0) {
    return (
      <EmptyState
        icon="sdk"
        title="No SDKs yet"
        description="Generate a typed client SDK from this spec in the languages you need."
        action={
          <Button variant="secondary" icon="sdk" onClick={openGen}>
            Generate SDKs
          </Button>
        }
      />
    );
  }
  return (
    <Table
      columns={sdkCols}
      rows={sdks}
      getRowKey={(t) => t.id}
      rowHref={(t) => `/sdks/${t.sdkId}/targets/${t.id}`}
      linkComponent={RouterLink}
    />
  );
}
