import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";
import { Input } from "./Input";

const meta: Meta<typeof Field> = {
  title: "Components/Field",
  component: Field,
  parameters: { layout: "centered" },
  args: {
    label: "API key name",
    htmlFor: "api-key-name",
    children: <Input id="api-key-name" placeholder="My secret key" />,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {};

export const WithHint: Story = {
  args: {
    label: "Organization slug",
    htmlFor: "org-slug",
    hint: "Lowercase letters, numbers, and dashes only.",
    children: <Input id="org-slug" placeholder="acme-inc" />,
  },
};

/** `required` renders a `*` right after the label. */
export const Required: Story = {
  args: {
    label: "Repository name",
    htmlFor: "repo-name",
    required: true,
    children: <Input id="repo-name" placeholder="my-sdk" />,
  },
};

/** `required` composes with the `labelHint` info (ⓘ) tooltip. */
export const RequiredWithLabelHint: Story = {
  args: {
    label: "Path prefix",
    htmlFor: "path-prefix",
    required: true,
    labelHint: "Optional subdirectory — leave empty to push to the repo root.",
    children: <Input id="path-prefix" placeholder="(repo root)" />,
  },
};
