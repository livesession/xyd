import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Badge, StatusPill } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "error", "accent"],
    },
    icon: { control: "select", options: ["", ...ICON_NAMES] },
    dot: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "Badge",
    tone: "neutral",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

/** Every tone rendered side by side. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="info">Info</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="error">Error</Badge>
      <Badge tone="accent">Accent</Badge>
    </div>
  ),
};

/** A leading icon instead of a dot. */
export const WithIcon: Story = {
  args: { tone: "info", icon: "box", children: "Package" },
};

/** A leading status dot. */
export const WithDot: Story = {
  args: { tone: "success", dot: true, children: "Live" },
};

/** StatusPill maps a build status to a dot badge. */
export const StatusPills: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill status="ready" />
      <StatusPill status="building" />
      <StatusPill status="error" />
      <StatusPill status="draft" />
      <StatusPill status="published" />
    </div>
  ),
};
