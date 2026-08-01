import { Badge, Button, DescriptionList } from "@apitoolchain/design-system";
import { SettingsHeader } from "~/components/SettingsHeader";
import { getCurrentContext } from "~/data";
import type { Route } from "./+types/settings.billing";

export function meta() {
  return [{ title: "Billing — apitoolchain" }];
}

export async function loader() {
  const { org } = await getCurrentContext();
  return { org };
}

export default function SettingsBillingRoute({
  loaderData,
}: Route.ComponentProps) {
  const { org } = loaderData;

  return (
    <>
      <SettingsHeader active="billing" />
      <div className="flex max-w-[600px] flex-col gap-6">
        <p className="text-sm text-subtle">
          Manage your plan and billing. apitoolchain is free while in preview —
          upgrade to lift generation + publishing limits.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-panel border border-line bg-surface p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                Current plan
              </span>
              <Badge tone="accent">{org.plan}</Badge>
            </div>
            <p className="m-0 text-xs text-subtle">
              Unlimited registry entries · generation + publishing limits apply.
            </p>
          </div>
          <div className="shrink-0">
            <Button variant="primary" icon="bolt" disabled>
              Upgrade
            </Button>
          </div>
        </div>

        <DescriptionList
          items={[
            { label: "Plan", value: org.plan },
            { label: "Billing", value: "Managed externally" },
            { label: "Payment method", value: "None on file" },
          ]}
        />

        <p className="text-xs text-subtle">
          Billing isn't wired up in this preview — upgrades are coming soon.
        </p>
      </div>
    </>
  );
}
