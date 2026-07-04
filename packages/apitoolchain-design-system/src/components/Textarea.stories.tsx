import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Design System/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  argTypes: {
    rows: { control: { type: "number" } },
    mono: { control: "boolean" },
    disabled: { control: "boolean" },
    onChange: { action: "change" },
  },
  args: {
    placeholder: "Paste your OpenAPI spec here…",
    rows: 8,
  },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "A quick note about this endpoint.",
    placeholder: undefined,
  },
};

/** The `mono` variant with more rows — for pasting code/specs. */
export const Mono: Story = {
  args: {
    mono: true,
    rows: 12,
    defaultValue:
      'openapi: 3.1.0\ninfo:\n  title: Pet Store\n  version: "1.0.0"\npaths:\n  /pets:\n    get:\n      summary: List pets',
    placeholder: undefined,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "This field is read-only.",
    placeholder: undefined,
  },
};
