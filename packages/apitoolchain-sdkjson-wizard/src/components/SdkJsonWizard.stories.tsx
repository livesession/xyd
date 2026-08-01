import { Button, Modal } from "@apitoolchain/design-system";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { createFetchPreview } from "../fetch-preview";
import type { GeneratePreview } from "../model/types";
import { SdkJsonWizard } from "./SdkJsonWizard";

const meta: Meta<typeof SdkJsonWizard> = {
  title: "SDK Wizard/SdkJsonWizard",
  component: SdkJsonWizard,
  parameters: { layout: "fullscreen" },
  argTypes: {
    generatePreview: { table: { disable: true } },
    onChange: { action: "change" },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-surface p-6 text-body">
        <div className="mx-auto max-w-[1200px]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SdkJsonWizard>;

/**
 * The real thing: `generatePreview` POSTs to the Storybook dev middleware, which
 * runs the ACTUAL opensdk emitters. Toggle options (export style, busybox,
 * package name, retries, …) or switch language and watch the generated code +
 * sdk.json update live. Requires `bun run storybook` (the middleware).
 */
const live = createFetchPreview();
export const LivePreview: Story = {
  args: { generatePreview: live },
};

/**
 * No server needed — a canned `PreviewResult` so the component renders in a
 * static build / CI. (The code shown is fixed, not generated.)
 */
const mock: GeneratePreview = async (req) => ({
  usage: [
    'import Acme from "acme";',
    "",
    "const client = new Acme({",
    '  apiKey: process.env["ACME_API_KEY"],',
    "});",
    "",
    "const result = await client.pets.list();",
    "console.log(result);",
    "",
  ].join("\n"),
  files: [
    {
      path: "src/index.ts",
      language: "typescript",
      code: `// mock generated client for ${req.language}\nexport default class Acme {\n  constructor(opts: { apiKey?: string }) {}\n}\n`,
    },
    {
      path: "package.json",
      language: "json",
      code: '{\n  "name": "acme",\n  "version": "1.0.0"\n}\n',
    },
  ],
});
export const Mock: Story = {
  args: { generatePreview: mock },
};

/**
 * Embedded in a DS Modal exactly like the apitoolchain-web "Generate SDKs" flow:
 * a `fill` xl modal (fixed height) with the wizard in `fill` mode — the top bar
 * stays put and the form + preview columns scroll independently, so a long form
 * never scrolls the usage out of view.
 */
export const InModal: Story = {
  parameters: { layout: "centered" },
  render: () => <InModalDemo />,
};

function InModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-2">
      <Button variant="primary" icon="sdk" onClick={() => setOpen(true)}>
        Configure SDKs
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        fill
        title="Configure your SDKs"
        description="Tune the generated code per language — the preview shows how each option changes the SDK."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button variant="primary" icon="sdk" onClick={() => setOpen(false)}>
              Generate
            </Button>
          </>
        }
      >
        <SdkJsonWizard generatePreview={live} languages={["node", "go"]} fill />
      </Modal>
    </div>
  );
}
