import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
  argTypes: {
    items: { control: "object" },
  },
  args: {
    items: [
      { label: "Docs", href: "#docs" },
      { label: "API Reference", href: "#api" },
      { label: "Create a chat completion" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {};

/** A two-level trail — the last item is the current page. */
export const TwoLevels: Story = {
  args: {
    items: [{ label: "Registry", href: "#registry" }, { label: "Overview" }],
  },
};

/** A single item renders as the current page with no separators. */
export const CurrentOnly: Story = {
  args: {
    items: [{ label: "Dashboard" }],
  },
};

/** A deep trail that wraps onto multiple lines in a narrow container. */
export const DeepTrail: Story = {
  args: {
    items: [
      { label: "Home", href: "#home" },
      { label: "Products", href: "#products" },
      { label: "SDKs", href: "#sdks" },
      { label: "TypeScript", href: "#typescript" },
      { label: "Installation" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-[280px] rounded-box border border-line p-4">
        <Story />
      </div>
    ),
  ],
};
