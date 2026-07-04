import type { Meta, StoryObj } from "@storybook/react";
import { StatusPill } from "./Badge";
import { EmptyState } from "./EmptyState";
import { Mono } from "./Mono";
import { type Column, Table } from "./Table";

interface Row {
  id: string;
  name: string;
  status: string;
  requests: string;
  updated: string;
}

const columns: Column<Row>[] = [
  {
    key: "name",
    header: "Name",
    width: "wide",
    render: (row) => <Mono>{row.name}</Mono>,
  },
  {
    key: "status",
    header: "Status",
    width: "sm",
    render: (row) => <StatusPill status={row.status} />,
  },
  { key: "requests", header: "Requests", width: "md", align: "right" },
  { key: "updated", header: "Updated", width: "lg" },
];

const rows: Row[] = [
  {
    id: "petstore",
    name: "petstore",
    status: "ready",
    requests: "128,402",
    updated: "2h ago",
  },
  {
    id: "billing",
    name: "billing-api",
    status: "building",
    requests: "42,910",
    updated: "10m ago",
  },
  {
    id: "legacy",
    name: "legacy-v1",
    status: "draft",
    requests: "0",
    updated: "3d ago",
  },
  {
    id: "notifier",
    name: "notifier",
    status: "error",
    requests: "7,204",
    updated: "1d ago",
  },
];

const meta: Meta<typeof Table> = {
  title: "Design System/Table",
  component: Table,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="max-w-[900px] p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Table>;

/** Column-driven data table: width presets + `render` cells (Mono name, StatusPill). */
export const Default: Story = {
  render: () => (
    <Table<Row> columns={columns} rows={rows} getRowKey={(row) => row.id} />
  ),
};

/** Each row becomes a link via `rowHref`. */
export const LinkedRows: Story = {
  render: () => (
    <Table<Row>
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      rowHref={(row) => `#/registry/${row.id}`}
    />
  ),
};

/** No rows — the `empty` prop renders an <EmptyState/> under the header. */
export const Empty: Story = {
  render: () => (
    <Table<Row>
      columns={columns}
      rows={[]}
      getRowKey={(row) => row.id}
      empty={
        <EmptyState
          icon="box"
          title="No API specs yet"
          description="Upload an OpenAPI document to populate the registry."
        />
      }
    />
  ),
};
