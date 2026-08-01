import {
  Button,
  DescriptionList,
  Field,
  Input,
  Mono,
} from "@apitoolchain/design-system";
import { Form, useNavigation } from "react-router";
import { SettingsHeader } from "~/components/SettingsHeader";
import { getCurrentContext, updateContext } from "~/data";
import type { Route } from "./+types/settings.organization";

export function meta() {
  return [{ title: "Organization — apitoolchain" }];
}

export async function loader() {
  const { org } = await getCurrentContext();
  return { org };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  return updateContext({
    orgName: String(form.get("orgName") ?? "").trim() || undefined,
  });
}

export default function SettingsOrganizationRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { org } = loaderData;
  const nav = useNavigation();
  const saving = nav.state !== "idle";

  return (
    <>
      <SettingsHeader active="organization" />
      <div className="flex max-w-[560px] flex-col gap-6">
        <p className="text-sm text-subtle">
          Your organization groups projects, members, APIs and SDKs. Everyone
          you invite shares it.
        </p>

        <Form
          method="post"
          className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5"
        >
          <div className="text-sm font-semibold text-ink">Organization</div>
          <Field label="Organization name" htmlFor="org">
            <Input id="org" name="orgName" defaultValue={org.name} />
          </Field>
          {actionData &&
            (actionData.ok ? (
              <div className="rounded-control bg-success-bg px-3 py-2 text-[13px] text-success">
                Organization saved.
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

        <DescriptionList
          items={[
            {
              label: "Organization ID",
              value: <Mono tone="muted">{org.id}</Mono>,
            },
            { label: "Plan", value: org.plan },
          ]}
        />
      </div>
    </>
  );
}
