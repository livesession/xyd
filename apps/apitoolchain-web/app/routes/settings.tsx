import { Button, Field, Input, Select } from "@apitoolchain/design-system";
import { Form, useNavigation } from "react-router";
import { SettingsHeader } from "~/components/SettingsHeader";
import { getCurrentContext, updateContext } from "~/data";
import type { Route } from "./+types/settings";

export function meta() {
  return [{ title: "Settings — apitoolchain" }];
}

const TABS = ["general", "organization", "members", "keys", "billing"] as const;
type Tab = (typeof TABS)[number];

export async function loader({ params }: Route.LoaderArgs) {
  const t = params.tab as Tab | undefined;
  const tab: Tab = t && TABS.includes(t) ? t : "general";
  const { org, project } = await getCurrentContext();
  return { tab, org, project };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  return updateContext({
    orgName: String(form.get("orgName") ?? "").trim() || undefined,
    projectName: String(form.get("projectName") ?? "").trim() || undefined,
  });
}

export default function SettingsRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { tab, org, project } = loaderData;
  const nav = useNavigation();
  const saving = nav.state !== "idle";

  return (
    <>
      <SettingsHeader active={tab} />
      <div className="flex max-w-[520px] flex-col gap-5">
        {tab === "general" ? (
          <Form method="post" className="flex flex-col gap-5">
            <Field label="Organization name" htmlFor="org">
              <Input id="org" name="orgName" defaultValue={org.name} />
            </Field>
            <Field label="Current project" htmlFor="prj">
              <Input id="prj" name="projectName" defaultValue={project.name} />
            </Field>
            <Field
              label="Region"
              htmlFor="region"
              hint="Where SDK/docs generation runs."
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
        ) : (
          <div className="py-10 text-sm text-subtle">
            The {tab} settings are coming soon.
          </div>
        )}
      </div>
    </>
  );
}
