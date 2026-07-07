import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { Breadcrumb } from "./Breadcrumb";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import { Tabs } from "./Tabs";

const meta: Meta<typeof PageHeader> = {
  title: "Design System/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    leadingActions: { control: false },
    breadcrumb: { control: false },
    actions: { control: false },
    tabs: { control: false },
    divider: { control: "boolean" },
  },
  args: {
    title: "Registry",
    description: "Browse and manage every API specification in your workspace.",
  },
  decorators: [
    (Story) => (
      <div className="bg-surface p-8 text-ink">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

/** Title + description with a right-aligned primary action. */
export const Default: Story = {
  args: {
    actions: (
      <Button variant="primary" icon="plus">
        New spec
      </Button>
    ),
  },
};

/** No actions — just the title and description (with the default divider). */
export const TitleOnly: Story = {};

/** Opt out of the default bottom divider. */
export const NoDivider: Story = {
  args: { divider: false },
};

/** Two actions: a secondary and a primary button. */
export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="secondary" icon="externalLink">
          Export
        </Button>
        <Button variant="primary" icon="plus">
          New spec
        </Button>
      </>
    ),
  },
};

/**
 * A compact status chip rendered inline, right after the title (via
 * `leadingActions`) — here a repo-sync indicator waiting on open PRs. Use for
 * at-a-glance status that belongs with the title, distinct from `actions`.
 */
export const WithLeadingActions: Story = {
  args: {
    title: "livesession-openapi",
    description: "OpenAPI spec connected to a git repo.",
    leadingActions: (
      <Badge tone="warning" icon="git">
        3 PRs to merge
      </Badge>
    ),
    actions: (
      <Button variant="secondary" icon="git">
        Connect a repo
      </Button>
    ),
  },
};

/** The synced state — the chip flips to a success tone. */
export const InSync: Story = {
  args: {
    title: "livesession-openapi",
    leadingActions: (
      <Badge tone="success" icon="git">
        In sync
      </Badge>
    ),
  },
};

/** Underline tabs rendered below the title. */
export const WithTabs: Story = {
  args: {
    actions: (
      <Button variant="primary" icon="plus">
        New spec
      </Button>
    ),
    tabs: (
      <Tabs
        activeKey="overview"
        items={[
          { key: "overview", label: "Overview" },
          { key: "endpoints", label: "Endpoints", count: 42 },
          { key: "sdks", label: "SDKs", count: 6 },
          { key: "settings", label: "Settings" },
        ]}
      />
    ),
  },
};

/** Breadcrumb above the title, plus actions and tabs. */
export const WithBreadcrumbAndTabs: Story = {
  args: {
    title: "Payments API",
    description: "OpenAPI 3.1 specification for the Payments service.",
    breadcrumb: (
      <Breadcrumb
        items={[{ label: "Registry", href: "#" }, { label: "Payments API" }]}
      />
    ),
    actions: (
      <>
        <Button variant="secondary" icon="externalLink">
          Export
        </Button>
        <Button variant="primary" icon="bolt">
          Publish
        </Button>
      </>
    ),
    tabs: (
      <Tabs
        activeKey="endpoints"
        items={[
          { key: "overview", label: "Overview" },
          { key: "endpoints", label: "Endpoints", count: 42 },
          { key: "sdks", label: "SDKs", count: 6 },
        ]}
      />
    ),
  },
};
