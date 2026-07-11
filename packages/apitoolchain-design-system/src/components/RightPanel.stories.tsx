import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { DropdownMenu } from "./DropdownMenu";
import { RightPanel, RightPanelSection } from "./RightPanel";

const meta: Meta<typeof RightPanel> = {
  title: "Components/RightPanel",
  component: RightPanel,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof RightPanel>;

/** Inline placement — a full-height column beside page content. */
export const Default: Story = {
  render: () => (
    <div className="flex min-h-[320px]">
      <div className="flex-1 pr-8 text-sm text-subtle">Page content…</div>
      <RightPanel placement="content-right">
        <RightPanelSection title="Actions">
          <Button variant="secondary" icon="plus">
            New version
          </Button>
          <Button variant="secondary" icon="sdk">
            Generate SDKs
          </Button>
        </RightPanelSection>
        <RightPanelSection title="Meta">
          <div className="rounded-control border border-line bg-surface p-3 text-sm text-subtle">
            Some stats…
          </div>
        </RightPanelSection>
      </RightPanel>
    </div>
  ),
};

/**
 * A section whose title carries a "more" menu — hidden until you hover the
 * section (or focus into it), then it fades in at the right edge of the title.
 */
export const WithTitleAction: Story = {
  render: () => (
    <div className="flex min-h-[320px]">
      <div className="flex-1 pr-8 text-sm text-subtle">
        Hover the Actions section →
      </div>
      <RightPanel placement="content-right">
        <RightPanelSection
          title="Actions"
          action={
            <DropdownMenu
              align="right"
              items={[
                {
                  key: "dist-tags",
                  label: "Manage dist-tags",
                  icon: "tags-outline",
                },
                { key: "download", label: "Download spec", icon: "download" },
                { key: "connect", label: "Connect another repo", icon: "git" },
              ]}
              trigger={
                <Button variant="ghost" size="sm" icon="more">
                  <span className="sr-only">More actions</span>
                </Button>
              }
            />
          }
        >
          <Button variant="secondary" icon="plus">
            New version
          </Button>
          <Button variant="secondary" icon="sdk">
            Generate SDKs
          </Button>
        </RightPanelSection>
      </RightPanel>
    </div>
  ),
};
