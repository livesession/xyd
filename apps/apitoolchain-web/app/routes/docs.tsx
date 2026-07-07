import {
  Badge,
  ButtonCTA,
  type Column,
  EmptyState,
  LaTable,
  Mono,
  PageHeader,
  StatusPill,
} from "@apitoolchain/design-system";
import { useMemo } from "react";
import { type DocsProject, listApis, listDocsProjects } from "~/data";
import { docsFilterSchema } from "~/data/filters";
import { useUrlFilters } from "~/hooks/useUrlFilters";
import type { Route } from "./+types/docs";

/** A docs project flattened with its API name + a search blob. */
type DocsRow = DocsProject & { apiName: string; search: string };

export function meta() {
  return [{ title: "Docs — apitoolchain" }];
}

export async function loader() {
  const [projects, apis] = await Promise.all([listDocsProjects(), listApis()]);
  const apiName = Object.fromEntries(apis.map((a) => [a.id, a.name]));
  const rows: DocsRow[] = projects.map((d) => ({
    ...d,
    apiName: apiName[d.apiId] ?? d.apiId,
    search: `${d.name} ${apiName[d.apiId] ?? ""} ${d.sourceSpec}`.toLowerCase(),
  }));
  return { rows, apis };
}

const CELL_LINK =
  "inline-flex items-center gap-[5px] text-[13px] text-blue no-underline";

export default function DocsRoute({ loaderData }: Route.ComponentProps) {
  const { rows, apis } = loaderData;

  const themes = [...new Set(rows.map((d) => d.theme))].sort();
  const facetKey = `${apis.map((a) => a.id).join(",")}|${themes.join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on the facet SETs, not array identity
  const schema = useMemo(() => docsFilterSchema(apis, themes), [facetKey]);
  const filter = useUrlFilters(schema);

  const columns: Column<DocsRow>[] = [
    {
      key: "name",
      header: "Name",
      width: "wide",
      render: (d) => <span className="font-medium text-ink">{d.name}</span>,
    },
    {
      key: "api",
      header: "API",
      width: "md",
      render: (d) => <span className="text-body">{d.apiName}</span>,
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
          <ButtonCTA variant="primary" icon="plus">
            New docs site
          </ButtonCTA>
        }
      />
      <LaTable
        filter={filter}
        data={rows}
        columns={columns}
        getRowKey={(d) => d.id}
        searchPlaceholder="Search docs sites…"
        empty={
          <EmptyState
            icon="docs"
            title="No docs sites match"
            description="Create a docs site to publish reference + guides, or clear the filters above."
            action={
              <ButtonCTA variant="primary" icon="plus">
                New docs site
              </ButtonCTA>
            }
          />
        }
      />
    </>
  );
}
