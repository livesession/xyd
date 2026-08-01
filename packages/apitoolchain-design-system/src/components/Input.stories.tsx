import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
  argTypes: {
    type: { control: "text" },
    onChange: { action: "changed" },
  },
  args: {
    placeholder: "Search the docs…",
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "sk-live-abc123" },
};

export const WithLeadingIcon: Story = {
  args: { leadingIcon: "search", placeholder: "Search the docs…" },
};

export const LeadingIconWithValue: Story = {
  args: { leadingIcon: "registry", defaultValue: "petstore-api" },
};

export const Disabled: Story = {
  args: { defaultValue: "read-only value", disabled: true },
};

export const DisabledWithLeadingIcon: Story = {
  args: {
    leadingIcon: "search",
    defaultValue: "read-only value",
    disabled: true,
  },
};
