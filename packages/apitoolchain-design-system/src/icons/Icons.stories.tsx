import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { ICON_NAMES } from "./registry";

/** The full icon registry — every glyph available via `<Icon icon="..." />`. */
const meta: Meta = {
  title: "Design System/Icons",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3 font-sans">
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2.5 rounded-panel border border-line px-2 py-4 text-ink"
        >
          <Icon icon={name} size={24} />
          <span className="break-words text-center text-[11px] text-muted">
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};
