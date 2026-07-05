import { Tabs } from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";

/** Path-based tabs for the SDKs area: grouped SDKs vs. the flat target list.
 * `q` (the active `?q=<SQL>` filter) is carried across so a namespace filter
 * survives switching views. */
export function SdksTabs({
  active,
  sdkCount,
  targetCount,
  q,
}: {
  active: "sdks" | "targets";
  sdkCount: number;
  targetCount: number;
  q?: string;
}) {
  const qp = q ? `?q=${encodeURIComponent(q)}` : "";
  return (
    <Tabs
      linkComponent={RouterLink}
      activeKey={active}
      items={[
        { key: "sdks", label: "SDKs", href: `/sdks${qp}`, count: sdkCount },
        {
          key: "targets",
          label: "Targets",
          href: `/sdks/targets${qp}`,
          count: targetCount,
        },
      ]}
    />
  );
}
