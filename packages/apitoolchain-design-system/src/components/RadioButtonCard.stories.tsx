import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioButtonCard } from "./RadioButtonCard";

const meta: Meta<typeof RadioButtonCard> = {
  title: "Design System/RadioButtonCard",
  component: RadioButtonCard,
  parameters: { layout: "padded" },
  argTypes: {
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    title: "LiveSession API",
    description: "livesession/livesession-api",
    selected: true,
  },
};

export default meta;
type Story = StoryObj<typeof RadioButtonCard>;

export const Default: Story = {};

/** Stack several in a `flex flex-col gap-2` for a single-select group. */
export const Group: Story = {
  render: () => {
    const OPTIONS = [
      { id: "livesession-api", name: "LiveSession API", ns: "livesession" },
      { id: "petstore", name: "Petstore", ns: "acme" },
      { id: "billing", name: "Billing", ns: "acme" },
    ];
    const [selected, setSelected] = useState("livesession-api");
    return (
      <div className="flex max-w-[420px] flex-col gap-2">
        {OPTIONS.map((o) => (
          <RadioButtonCard
            key={o.id}
            selected={o.id === selected}
            onSelect={() => setSelected(o.id)}
            title={o.name}
            description={`${o.ns}/${o.id}`}
          />
        ))}
      </div>
    );
  },
};
