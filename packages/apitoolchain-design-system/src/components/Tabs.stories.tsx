import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
  argTypes: {
    onChange: { action: "change" },
  },
  args: {
    activeKey: "overview",
    items: [
      { key: "overview", label: "Overview" },
      { key: "endpoints", label: "Endpoints" },
      { key: "schemas", label: "Schemas" },
      { key: "settings", label: "Settings" },
    ],
  },
  decorators: [
    // Tabs render just the tab list; the baseline underline is provided by the
    // container (PageHeader in the app) — replicate it here for the gallery.
    (Story) => (
      <div className="w-[560px] border-b border-line">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

/** Tabs with trailing counts, e.g. a registry item detail view. */
export const WithCounts: Story = {
  args: {
    activeKey: "versions",
    items: [
      { key: "versions", label: "Versions", count: 12 },
      { key: "sdks", label: "SDKs", count: 6 },
      { key: "changelog", label: "Changelog", count: 34 },
      { key: "usage", label: "Usage" },
    ],
  },
};

/** A later tab is active, showing the underline on a non-first item. */
export const SecondActive: Story = {
  args: { activeKey: "schemas" },
};
