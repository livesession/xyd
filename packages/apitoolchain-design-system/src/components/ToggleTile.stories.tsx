import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Icon } from "../icons";
import { Badge } from "./Badge";
import { ToggleTile } from "./ToggleTile";

const meta: Meta<typeof ToggleTile> = {
  title: "Design System/ToggleTile",
  component: ToggleTile,
  parameters: { layout: "padded" },
  args: { label: "TypeScript", checked: true },
};

export default meta;
type Story = StoryObj<typeof ToggleTile>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <ToggleTile {...args} leading={<Icon icon="sdk" size={16} />} />
    </div>
  ),
};

/** `trailing` swaps the toggle for any node — e.g. a "Soon" badge on a disabled tile. */
export const ComingSoon: Story = {
  render: () => (
    <div className="w-64">
      <ToggleTile
        disabled
        label="Rust"
        leading={<Icon icon="sdk" size={16} />}
        trailing={<Badge tone="neutral">Soon</Badge>}
      />
    </div>
  ),
};

/** A multi-select group (e.g. picking SDK languages). */
export const Group: Story = {
  render: () => {
    const LANGS = [
      { v: "go", l: "Go" },
      { v: "python", l: "Python" },
      { v: "node", l: "TypeScript" },
      { v: "ruby", l: "Ruby" },
    ];
    const [sel, setSel] = useState<Set<string>>(new Set(["go"]));
    const toggle = (v: string) =>
      setSel((s) => {
        const n = new Set(s);
        if (n.has(v)) n.delete(v);
        else n.add(v);
        return n;
      });
    return (
      <div className="grid w-[420px] grid-cols-2 gap-2">
        {LANGS.map((l) => (
          <ToggleTile
            key={l.v}
            label={l.l}
            checked={sel.has(l.v)}
            onChange={() => toggle(l.v)}
            leading={<Icon icon="sdk" size={16} />}
          />
        ))}
      </div>
    );
  },
};
