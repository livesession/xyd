import type { Meta, StoryObj } from "@storybook/react";
import { LangIcon, type LangIconName } from "./LangIcon";

const NAMES: LangIconName[] = [
  "typescript",
  "python",
  "go",
  "ruby",
  "java",
  "csharp",
];

const meta: Meta<typeof LangIcon> = {
  title: "Design System/LangIcon",
  component: LangIcon,
  parameters: { layout: "centered" },
  argTypes: {
    name: { control: "inline-radio", options: NAMES },
  },
  args: { name: "typescript", className: "size-8" },
};

export default meta;
type Story = StoryObj<typeof LangIcon>;

/** A single brand logo — each carries its own colours (not `currentColor`). */
export const Default: Story = {};

/** Every language logo the design system ships. */
export const AllLanguages: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {NAMES.map((name) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <LangIcon name={name} className="size-8" />
          <span className="text-xs text-subtle">{name}</span>
        </div>
      ))}
    </div>
  ),
};
