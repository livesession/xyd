import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Search } from "./Search";

const meta: Meta<typeof Search> = {
  title: "Components/Search",
  component: Search,
  parameters: { layout: "padded" },
  argTypes: { placeholder: { control: "text" } },
  args: { placeholder: "Search…" },
};

export default meta;
type Story = StoryObj<typeof Search>;

export const Default: Story = {};

export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState("");
    return (
      <Search
        value={v}
        onChange={setV}
        placeholder="Search APIs…"
        className="w-72"
      />
    );
  },
};
