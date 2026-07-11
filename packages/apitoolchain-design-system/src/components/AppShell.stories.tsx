import type { Meta, StoryObj } from "@storybook/react";
import { AppShell, ContentSection, ContentSections } from "./AppShell";
import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import { RightPanel, RightPanelSection } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { Tabs } from "./Tabs";

const meta: Meta<typeof AppShell> = {
  title: "Components/AppShell",
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

/**
 * Split page content into bands with {@link ContentSections}. A `divided` band —
 * here "Targets" — draws a full-bleed rule above it that runs edge to edge,
 * touching the sidebar on the left and the content-right rail on the right. (The
 * content column uses a `pr-12` gutter so the `-mx-12` bleed lands on the rail.)
 */
export const WithContentSections: Story = {
  args: {
    children: (
      <>
        <PageHeader
          title="petstore-sdk"
          description="A generated SDK for the Petstore API."
        />
        <div className="-mt-6 -mb-16 flex flex-1">
          <div className="min-w-0 flex-1 pt-6 pr-12 pb-16">
            <ContentSections>
              <ContentSection>
                <div className="flex flex-col gap-2 text-ink">
                  <h2 className="m-0 text-sm font-semibold">Details</h2>
                  <p className="m-0 text-sm text-subtle">
                    Version, API, namespace, registry — the SDK's own metadata.
                  </p>
                </div>
              </ContentSection>
              <ContentSection divided>
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-semibold text-ink">Targets</div>
                  <div className="rounded-box border border-line p-6 text-ink">
                    The Targets table sits in its own band — the rule above runs
                    edge to edge, touching the sidebar and the rail.
                  </div>
                </div>
              </ContentSection>
            </ContentSections>
          </div>
          <RightPanel placement="content-right">
            <RightPanelSection title="Actions">
              <Button variant="secondary" icon="plus">
                New version
              </Button>
              <Button variant="secondary" icon="sdk">
                Add target
              </Button>
            </RightPanelSection>
          </RightPanel>
        </div>
      </>
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
