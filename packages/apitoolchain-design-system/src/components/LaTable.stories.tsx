import { defineFilterSchema, useFilterComposer } from "@apitoolchain/filters";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { LaTable } from "./LaTable";
import type { Column } from "./Table";

interface Api {
  id: string;
  name: string;
  namespace: string;
  status: string;
  language: string[];
}

const DATA: Api[] = [
  {
    id: "payments",
    name: "Payments",
    namespace: "acme",
    status: "ready",
    language: ["go", "python"],
  },
  {
    id: "billing",
    name: "Billing",
    namespace: "acme",
    status: "building",
    language: ["node"],
  },
  {
    id: "sessions",
    name: "Sessions",
    namespace: "livesession",
    status: "ready",
    language: ["go", "node"],
  },
  {
    id: "identity",
    name: "Identity",
    namespace: "livesession",
    status: "ready",
    language: ["python"],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    namespace: "acme",
    status: "building",
    language: ["go"],
  },
];

// Introduce the table's columns as filter fields — chip key = row property + SQL column.
const SCHEMA = defineFilterSchema({
  table: "apis",
  alias: "filters",
  fields: [
    {
      key: "namespace",
      label: "Namespace",
      column: "namespace",
      type: "enum",
      icon: "registry",
      values: [
        { value: "acme", label: "acme" },
        { value: "livesession", label: "livesession" },
      ],
    },
    {
      key: "language",
      label: "Language",
      column: "language",
      type: "enum",
      icon: "sdk",
      values: [
        { value: "go", label: "Go" },
        { value: "python", label: "Python" },
        { value: "node", label: "TypeScript" },
      ],
    },
    {
      key: "status",
      label: "Status",
      column: "status",
      type: "enum",
      icon: "check",
      values: [
        { value: "ready", label: "Ready" },
        { value: "building", label: "Building" },
      ],
    },
    {
      key: "name",
      label: "Name",
      column: "name",
      type: "text",
      icon: "search",
      freeText: true,
    },
  ],
});

const COLUMNS: Column<Api>[] = [
  {
    key: "name",
    header: "API",
    width: "wide",
    render: (a) => (
      <div className="flex flex-col">
        <span className="font-medium text-ink">{a.name}</span>
        <span className="text-xs text-subtle">
          {a.namespace}/{a.id}
        </span>
      </div>
    ),
  },
  {
    key: "language",
    header: "Languages",
    render: (a) => (
      <div className="flex flex-wrap gap-1">
        {a.language.map((l) => (
          <Badge key={l} tone="neutral">
            {l}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "right",
    render: (a) => (
      <Badge tone={a.status === "ready" ? "success" : "info"}>{a.status}</Badge>
    ),
  },
];

const meta: Meta = {
  title: "La/LaTable",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

/**
 * `LaTable` connects the filters to a table and runs the query against it. Pick
 * filters / type in the search and the rows update in place — `filter.run(data)`
 * is the in-memory twin of the SQL shown below (what a backend would run).
 */
export const Default: Story = {
  render: () => {
    const filter = useFilterComposer(SCHEMA, {
      rules: [{ key: "status", values: ["ready"] }],
    });
    return (
      <div className="flex max-w-[820px] flex-col gap-4">
        <LaTable
          filter={filter}
          data={DATA}
          columns={COLUMNS}
          getRowKey={(a) => a.id}
          searchPlaceholder="Search APIs…"
          empty={
            <span className="text-subtle">No APIs match these filters.</span>
          }
        />
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Compiled query
          </div>
          <pre className="overflow-x-auto rounded-control border border-line bg-surface-muted px-3 py-2 text-xs text-ink">
            {filter.compile().sql}
          </pre>
        </div>
      </div>
    );
  },
};
