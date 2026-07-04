import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";
import { Input } from "./Input";

const meta: Meta<typeof Field> = {
  title: "Design System/Field",
  component: Field,
  parameters: { layout: "centered" },
  args: {
    label: "API key name",
    htmlFor: "api-key-name",
    children: <Input id="api-key-name" placeholder="My secret key" />,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {};

export const WithHint: Story = {
  args: {
    label: "Organization slug",
    htmlFor: "org-slug",
    hint: "Lowercase letters, numbers, and dashes only.",
    children: <Input id="org-slug" placeholder="acme-inc" />,
  },
};
