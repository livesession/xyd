import type { Meta, StoryObj } from "@storybook/react";
import { Panel } from "./Panel";

const meta: Meta<typeof Panel> = {
  title: "Components/Panel",
  component: Panel,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Panel>;

/** The bordered, rounded container wrapping arbitrary content. */
export const Default: Story = {
  render: () => (
    <Panel>
      <h3 className="text-ink">Panel heading</h3>
      <p className="text-muted">
        A bordered, rounded content container that groups related information.
      </p>
    </Panel>
  ),
};

/** A denser layout with a header row and a stack of key/value rows. */
export const WithDetails: Story = {
  render: () => (
    <Panel>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <span className="text-ink">API key</span>
        <span className="text-muted">Active</span>
      </div>
      <div className="flex flex-col gap-3 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">Created</span>
          <span className="text-ink">Jan 4, 2026</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Last used</span>
          <span className="text-ink">2 hours ago</span>
        </div>
      </div>
    </Panel>
  ),
};

/** Nested panels showing the container composes with other content. */
export const Nested: Story = {
  render: () => (
    <Panel>
      <p className="text-ink">Outer panel</p>
      <div className="flex flex-col gap-3 pt-4">
        <Panel>
          <span className="text-muted">First inner panel</span>
        </Panel>
        <Panel>
          <span className="text-muted">Second inner panel</span>
        </Panel>
      </div>
    </Panel>
  ),
};
