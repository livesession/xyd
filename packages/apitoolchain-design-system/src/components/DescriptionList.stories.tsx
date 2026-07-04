import type { Meta, StoryObj } from "@storybook/react";
import { DescriptionList } from "./DescriptionList";

const meta: Meta<typeof DescriptionList> = {
  title: "Design System/DescriptionList",
  component: DescriptionList,
  parameters: { layout: "padded" },
  args: {
    items: [
      { label: "Base URL", value: "https://api.example.com/v1" },
      { label: "Auth", value: "Bearer token" },
      { label: "Version", value: "2024-08-01" },
      { label: "Rate limit", value: "10,000 req / min" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DescriptionList>;

export const Default: Story = {};

export const TwoItems: Story = {
  args: {
    items: [
      { label: "Status", value: "Operational" },
      { label: "Region", value: "us-east-1" },
    ],
  },
};

/** Values can be arbitrary ReactNode, not just strings. */
export const RichValues: Story = {
  args: {
    items: [
      {
        label: "Endpoint",
        value: <code className="text-ink">POST /v1/chat/completions</code>,
      },
      {
        label: "Latency",
        value: <span className="font-semibold text-ink">42ms p50</span>,
      },
      { label: "Uptime", value: "99.98%" },
    ],
  },
};
