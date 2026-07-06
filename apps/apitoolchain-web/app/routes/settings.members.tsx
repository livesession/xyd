import {
  Badge,
  Button,
  Field,
  Input,
  Select,
} from "@apitoolchain/design-system";
import { Form, useNavigation } from "react-router";
import { SettingsHeader } from "~/components/SettingsHeader";
import {
  inviteMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "~/data";
import type { Route } from "./+types/settings.members";

export function meta() {
  return [{ title: "Members — apitoolchain" }];
}

export async function loader() {
  return { members: await listMembers() };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  switch (intent) {
    case "invite":
      return inviteMember(
        String(form.get("email") ?? "").trim(),
        String(form.get("role") ?? "member"),
      );
    case "remove":
      return removeMember(String(form.get("userId") ?? ""));
    case "role":
      return updateMemberRole(
        String(form.get("userId") ?? ""),
        String(form.get("role") ?? "member"),
      );
    default:
      return { ok: false, message: "unknown intent" };
  }
}

const ROLES = [
  { value: "member", label: "Member" },
  { value: "owner", label: "Owner" },
];

export default function MembersRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { members } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <>
      <SettingsHeader active="members" />
      <div className="flex max-w-[640px] flex-col gap-5">
        <p className="text-sm text-subtle">
          Members share this organization's projects, APIs, and SDKs. Invite
          someone who has already signed up by their email.
        </p>

        <Form
          method="post"
          className="flex items-end gap-3 rounded-panel border border-line bg-surface p-4"
        >
          <input type="hidden" name="intent" value="invite" />
          <div className="flex-1">
            <Field label="Invite by email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="teammate@company.com"
              />
            </Field>
          </div>
          <Select name="role" defaultValue="member" options={ROLES} />
          <Button type="submit" variant="primary" disabled={busy}>
            Invite
          </Button>
        </Form>

        {actionData && !actionData.ok && (
          <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
            {actionData.message}
          </div>
        )}

        <div className="flex flex-col divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {m.name || m.email}
                </div>
                <div className="truncate text-xs text-subtle">{m.email}</div>
              </div>
              <Badge tone={m.role === "owner" ? "accent" : "neutral"}>
                {m.role}
              </Badge>
              <Form method="post">
                <input type="hidden" name="intent" value="remove" />
                <input type="hidden" name="userId" value={m.userId} />
                <button
                  type="submit"
                  className="cursor-pointer border-none bg-transparent text-[13px] text-subtle hover:text-danger"
                >
                  Remove
                </button>
              </Form>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
