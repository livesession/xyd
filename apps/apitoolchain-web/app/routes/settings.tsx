import { Button, Field, Input, Select } from "@apitoolchain/design-system";
import { Form, useNavigation } from "react-router";
import { SettingsHeader } from "~/components/SettingsHeader";
import { getCurrentContext, updateContext } from "~/data";
import type { Route } from "./+types/settings";

export function meta() {
  return [{ title: "Settings — apitoolchain" }];
}

export async function loader() {
  const { project } = await getCurrentContext();
  return { project };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  return updateContext({
    projectName: String(form.get("projectName") ?? "").trim() || undefined,
  });
}

export default function SettingsGeneralRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { project } = loaderData;
  const nav = useNavigation();
  const saving = nav.state !== "idle";

  return (
    <>
      <SettingsHeader active="general" />
      <div className="flex max-w-[560px] flex-col gap-6">
        <p className="text-sm text-subtle">
          General settings for your current project. Organization-wide settings
          live under <span className="font-medium text-ink">Organization</span>.
        </p>

        <Form
          method="post"
          className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5"
        >
          <div className="text-sm font-semibold text-ink">Project</div>
          <Field label="Project name" htmlFor="prj">
            <Input id="prj" name="projectName" defaultValue={project.name} />
          </Field>
          <Field
            label="Region"
            htmlFor="region"
            hint="Where SDK and docs generation runs."
          >
            <Select
              id="region"
              defaultValue="us"
              options={[
                { value: "us", label: "US (Oregon)" },
                { value: "eu", label: "EU (Frankfurt)" },
              ]}
            />
          </Field>
          {actionData &&
            (actionData.ok ? (
              <div className="rounded-control bg-success-bg px-3 py-2 text-[13px] text-success">
                Settings saved.
              </div>
            ) : (
              <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
                {actionData.message}
              </div>
            ))}
          <div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
