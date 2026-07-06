import {
  Badge,
  Button,
  type Column,
  EmptyState,
  LaTable,
  Menu,
  Mono,
  PageHeader,
  StatusPill,
} from "@apitoolchain/design-system";
import { useMemo } from "react";
import { RouterLink } from "~/components/RouterLink";
import { type DocsProject, listApis, listDocsProjects } from "~/data";
import { docsFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import type { Route } from "./+types/docs";

export function meta() {
  return [{ title: "Docs — apitoolchain" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const apis = await listApis();
  const apiId = new URL(request.url).searchParams.get("apiId") ?? apis[0]?.id;
  const projects = await listDocsProjects(apiId);
  const selected = apis.find((a) => a.id === apiId);
  return { apis, apiId, selectedName: selected?.name ?? null, projects };
}

const CELL_LINK =
  "inline-flex items-center gap-[5px] text-[13px] text-blue no-underline";

export default function DocsRoute({ loaderData }: Route.ComponentProps) {
  const { apis, apiId, selectedName, projects } = loaderData;

  const themes = [...new Set(projects.map((d) => d.theme))].sort();
  const themeKey = themes.join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the theme SET, not array identity
  const schema = useMemo(() => docsFilterSchema(themes), [themeKey]);
  const filter = useUrlFilters(schema);
  // Preserve the active `?q=` when switching the API selector.
  const qActive = filter.rules.length > 0 || filter.query.trim().length > 0;
  const qParam = qActive ? `&q=${encodeURIComponent(filter.toQuery())}` : "";

  const columns: Column<DocsProject>[] = [
    {
      key: "name",
      header: "Name",
      width: "wide",
      render: (d) => <span className="font-medium text-ink">{d.name}</span>,
    },
    {
      key: "theme",
      header: "Theme",
      width: "sm",
      render: (d) => <Badge tone="neutral">{d.theme}</Badge>,
    },
    {
      key: "sourceSpec",
      header: "Source spec",
      width: "auto",
      render: (d) => <Mono tone="muted">{d.sourceSpec}</Mono>,
    },
    {
      key: "url",
      header: "Site",
      width: "md",
      render: (d) => (
        <a
          href={d.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={CELL_LINK}
        >
          Visit
        </a>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "sm",
      render: (d) => <StatusPill status={d.status} />,
    },
    {
      key: "lastBuiltAt",
      header: "Built",
      width: "sm",
      align: "right",
      render: (d) => (
        <span className="text-subtle">{d.lastBuiltAt ?? "—"}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Docs"
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
                href: `/docs?apiId=${a.id}${qParam}`,
                active: a.id === apiId,
              }))}
            />
            <Button variant="primary" icon="plus">
              New docs site
            </Button>
          </>
        }
      />
      <LaTable
        filter={filter}
        data={projects}
        columns={columns}
        getRowKey={(d) => d.id}
        searchPlaceholder="Search docs sites…"
        empty={
          <EmptyState
            icon="docs"
            title="No docs sites match"
            description="Create a docs site to publish reference + guides for this API, or clear the filters above."
            action={
              <Button variant="primary" icon="plus">
                New docs site
              </Button>
            }
          />
        }
      />
    </>
  );
}
