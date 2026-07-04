import {
  Badge,
  Button,
  type Column,
  EmptyState,
  Menu,
  Mono,
  PageHeader,
  StatusPill,
  Table,
} from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";
import {
  listApis,
  listSdkTargets,
  type SdkLanguage,
  type SdkTarget,
} from "~/data";
import type { Route } from "./+types/sdks";

export function meta() {
  return [{ title: "SDKs — apitoolchain" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const apis = await listApis();
  const apiId = new URL(request.url).searchParams.get("apiId") ?? apis[0]?.id;
  const targets = await listSdkTargets(apiId);
  const selected = apis.find((a) => a.id === apiId);
  return { apis, apiId, selectedName: selected?.name ?? null, targets };
}

const LANG: Record<SdkLanguage, string> = {
  go: "Go",
  python: "Python",
  node: "Node",
  ruby: "Ruby",
  java: "Java",
  dotnet: ".NET",
};

export default function SdksRoute({ loaderData }: Route.ComponentProps) {
  const { apis, apiId, selectedName, targets } = loaderData;

  const columns: Column<SdkTarget>[] = [
    {
      key: "language",
      header: "Language",
      width: "md",
      render: (t) => (
        <Badge tone="neutral" icon="sdk">
          {LANG[t.language]}
        </Badge>
      ),
    },
    {
      key: "packageName",
      header: "Package",
      width: "wide",
      render: (t) => <Mono>{t.packageName}</Mono>,
    },
    {
      key: "version",
      header: "Version",
      width: "xs",
      render: (t) => `v${t.version}`,
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      render: (t) => <StatusPill status={t.status} />,
    },
    {
      key: "lastPublishedAt",
      header: "Published",
      width: "md",
      align: "right",
      render: (t) => (
        <span className="text-subtle">{t.lastPublishedAt ?? "—"}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="SDKs"
        description="Generate idiomatic client libraries from a registered API, in every language you ship."
        actions={
          <>
            <Menu
              variant="select"
              icon="registry"
              label={selectedName ?? "Select API"}
              linkComponent={RouterLink}
              items={apis.map((a) => ({
                key: a.id,
                label: a.name,
                href: `/sdks?apiId=${a.id}`,
                active: a.id === apiId,
              }))}
            />
            <Button variant="primary" icon="plus">
              New target
            </Button>
          </>
        }
      />
      <Table
        columns={columns}
        rows={targets}
        getRowKey={(t) => t.id}
        empty={
          <EmptyState
            icon="sdk"
            title="No SDK targets"
            description="Add a language target to generate an SDK for this API."
            action={
              <Button variant="primary" icon="plus">
                New target
              </Button>
            }
          />
        }
      />
    </>
  );
}
