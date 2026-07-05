import { PageHeader, Tabs } from "@apitoolchain/design-system";
import { RouterLink } from "./RouterLink";

/** Settings tab bar — shared across the Settings pages (some tabs are query-param
 * views of `/settings`, others are their own routes) so it stays consistent. */
const ITEMS = [
  { key: "general", label: "General", href: "/settings/general" },
  {
    key: "organization",
    label: "Organization",
    href: "/settings/organization",
  },
  { key: "members", label: "Members", href: "/settings/members" },
  { key: "keys", label: "API keys", href: "/settings/keys" },
  { key: "namespaces", label: "Namespaces", href: "/settings/namespaces" },
  { key: "connections", label: "Connections", href: "/settings/connections" },
  { key: "billing", label: "Billing", href: "/settings/billing" },
];

export function SettingsHeader({ active }: { active: string }) {
  return (
    <PageHeader
      title="Settings"
      description="Manage your organization, project, namespaces, connections and billing."
      tabs={
        <Tabs linkComponent={RouterLink} activeKey={active} items={ITEMS} />
      }
    />
  );
}
