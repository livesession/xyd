import type { Meta, StoryObj } from "@storybook/react";
import { AppShell } from "./AppShell";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import { RightPanel, RightPanelSection } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { Tabs } from "./Tabs";

const meta: Meta<typeof AppShell> = {
  title: "Design System/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  args: {
    sidebar: <Sidebar />,
    children: (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink">Home</h1>
        <p className="text-body text-subtle">
          The application frame renders a fixed sidebar next to a scrollable
          main content column.
        </p>
        <div className="rounded-box border border-line p-6 text-ink">
          Page content goes here.
        </div>
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

/** The default frame: `<Sidebar/>` next to a scrollable content column. */
export const Default: Story = {};

/** A page fills the contextual right rail by rendering `<RightPanel>`. */
export const WithRightPanel: Story = {
  args: {
    children: (
      <>
        <PageHeader
          title="LiveSession API"
          description="Sessions, events, and analytics."
        />
        <div className="rounded-box border border-line p-6 text-ink">
          Page content. The right rail holds contextual actions.
        </div>
        <RightPanel>
          <RightPanelSection title="Actions">
            <Button variant="secondary" icon="plus">
              New version
            </Button>
            <Button variant="secondary" icon="sdk">
              Generate SDKs
            </Button>
          </RightPanelSection>
        </RightPanel>
      </>
    ),
  },
};

/**
 * `placement="content-right"`: the panel is inline, to the right of the page
 * content and below the header — its border meets the header's bottom border and
 * runs the full content height. (The page composes the flex row.)
 */
export const ContentRightPanel: Story = {
  args: {
    children: (
      <>
        <PageHeader
          title="LiveSession API"
          description="Sessions, events, and analytics."
        />
        <div className="-mt-6 -mb-16 flex flex-1">
          <div className="min-w-0 flex-1 pt-6 pr-8 pb-16">
            <div className="rounded-box border border-line p-6 text-ink">
              Main content. The right panel border meets the header divider and
              runs to the bottom.
            </div>
          </div>
          <RightPanel placement="content-right">
            <RightPanelSection title="Actions">
              <Button variant="secondary" icon="plus">
                New version
              </Button>
              <Button variant="secondary" icon="sdk">
                Generate SDKs
              </Button>
            </RightPanelSection>
          </RightPanel>
        </div>
      </>
    ),
  },
};

/** The typical page shape: a {@link PageHeader} (with tabs whose underline is
 * full-bleed to the sidebar) above the page content. */
export const WithPageHeader: Story = {
  args: {
    children: (
      <>
        <PageHeader
          title="Registry"
          description="Every API spec and schema you've registered — versioned and tagged."
          tabs={
            <Tabs
              activeKey="api"
              items={[
                { key: "api", label: "API Specs", count: 4 },
                { key: "schema", label: "Schemas", count: 2 },
              ]}
            />
          }
        />
        <div className="rounded-box border border-line p-6 text-ink">
          Tab content goes here. Note the tab underline meets the sidebar.
        </div>
      </>
    ),
  },
};

/** With a top bar rendered above the scrollable content. */
export const WithTopBar: Story = {
  args: {
    topBar: (
      <div className="flex items-center justify-between border-b border-line-soft bg-surface px-12 py-4">
        <span className="text-sm font-semibold text-ink">Overview</span>
        <span className="text-xs text-subtle">Free plan</span>
      </div>
    ),
  },
};

/** Long content demonstrates the scrollable main column. */
export const ScrollingContent: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink">Registry</h1>
        {Array.from({ length: 24 }, (_, i) => `row-${i + 1}`).map((row) => (
          <div
            key={row}
            className="rounded-box border border-line p-6 text-ink"
          >
            {row}
          </div>
        ))}
      </div>
    ),
  },
};
