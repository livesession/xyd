import {
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Tabs,
} from "@apitoolchain/design-system";
import { RouterLink } from "~/components/RouterLink";
import { getCurrentContext } from "~/data";
import type { Route } from "./+types/settings";

export function meta() {
  return [{ title: "Settings — apitoolchain" }];
}

const TABS = ["general", "organization", "members", "keys", "billing"] as const;
type Tab = (typeof TABS)[number];

export async function loader({ request }: Route.LoaderArgs) {
  const t = new URL(request.url).searchParams.get("tab") as Tab | null;
  const tab: Tab = t && TABS.includes(t) ? t : "general";
  const { org, project } = await getCurrentContext();
  return { tab, org, project };
}

export default function SettingsRoute({ loaderData }: Route.ComponentProps) {
  const { tab, org, project } = loaderData;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your organization, project, members and billing."
        tabs={
          <Tabs
            linkComponent={RouterLink}
            activeKey={tab}
            items={[
              {
                key: "general",
                label: "General",
                href: "/settings?tab=general",
              },
              {
                key: "organization",
                label: "Organization",
                href: "/settings?tab=organization",
              },
              {
                key: "members",
                label: "Members",
                href: "/settings?tab=members",
              },
              { key: "keys", label: "API keys", href: "/settings?tab=keys" },
              {
                key: "billing",
                label: "Billing",
                href: "/settings?tab=billing",
              },
            ]}
          />
        }
      />
      <div className="flex max-w-[520px] flex-col gap-5">
        {tab === "general" ? (
          <>
            <Field label="Organization name" htmlFor="org">
              <Input id="org" defaultValue={org.name} />
            </Field>
            <Field label="Default project" htmlFor="prj">
              <Input id="prj" defaultValue={project.name} />
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
            <div>
              <Button variant="primary">Save changes</Button>
            </div>
          </>
        ) : (
          <div className="py-10 text-sm text-subtle">
            The {tab} settings are coming soon.
          </div>
        )}
      </div>
    </>
  );
}
