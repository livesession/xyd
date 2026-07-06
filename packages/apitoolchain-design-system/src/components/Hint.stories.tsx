import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";
import { Hint } from "./Hint";
import { Input } from "./Input";

const meta: Meta<typeof Hint> = {
  title: "Design System/Hint",
  component: Hint,
  parameters: { layout: "centered" },
  args: {
    children: "This explanation appears on hover or keyboard focus.",
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    size: { control: { type: "range", min: 12, max: 24, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Hint>;

/** The bare info (ⓘ) icon + its tooltip. */
export const Default: Story = {};

/** Inline beside a label — the intended use, via `Field`'s `labelHint`. */
export const OnAFieldLabel: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="w-[320px] font-sans">
      <Field
        label="Release mode"
        htmlFor="rm-demo"
        labelHint="Direct push commits straight to the branch. Release opens a versioned PR (changelog) and tags + cuts a Release on merge."
      >
        <Input id="rm-demo" value="Release PRs" onChange={() => {}} />
      </Field>
    </div>
  ),
};
