import type { Meta, StoryObj } from "@storybook/react";
import { ICON_NAMES } from "../icons";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Design System/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  argTypes: {
    icon: { control: "select", options: ["", ...ICON_NAMES] },
  },
  args: {
    icon: "box",
    title: "No API specs yet",
    description:
      "Upload an OpenAPI document to generate reference docs, SDKs, and an MCP server.",
  },
  decorators: [
    (Story) => (
      <div className="w-[560px] rounded-box border border-line bg-surface">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

/** With a primary CTA action. */
export const WithAction: Story = {
  args: {
    action: <Button variant="primary">Upload spec</Button>,
  },
};

/** Title-only, no icon or description. */
export const TitleOnly: Story = {
  args: {
    icon: undefined,
    title: "Nothing here yet",
    description: undefined,
  },
};
