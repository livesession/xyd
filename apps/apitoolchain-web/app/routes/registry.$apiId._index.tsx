import { DescriptionList, Menu, Mono } from "@apitoolchain/design-system";
import { useState } from "react";
import { useOutletContext } from "react-router";
import { FORMAT } from "~/components/RegistryListPage";
import {
  type RegistryDetailContext,
  TagBadges,
} from "~/components/registryDetailShared";
import { formatVersion } from "~/version";

export { registryDetailAction as action } from "~/lib/registryDetailAction";

export default function RegistryOverviewTab() {
  const { api, isSchema, tagsByVersion } =
    useOutletContext<RegistryDetailContext>();
  const current = api.versions.find((v) => v.current);
  // The version filter drives which version's details show.
  const [versionSel, setVersionSel] = useState(current?.version ?? "");
  const shownVersion =
    api.versions.find((v) => v.version === versionSel) ?? current;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-subtle">Version</span>
        <Menu
          variant="select"
          icon="tags-outline"
          label={formatVersion(shownVersion?.version)}
          items={api.versions.map((v) => ({
            key: v.version,
            label: `${formatVersion(v.version)}${v.current ? " · current" : ""}`,
            active: v.version === shownVersion?.version,
            onSelect: () => setVersionSel(v.version),
          }))}
        />
      </div>
      <DescriptionList
        items={[
          { label: "Format", value: FORMAT[api.format].label },
          { label: "Namespace", value: api.namespace },
          {
            label: "Dist-tag",
            value: (
              <TagBadges
                tags={tagsByVersion.get(shownVersion?.version ?? "") ?? []}
              />
            ),
          },
          {
            label: "Spec URL",
            value: <Mono tone="muted">{shownVersion?.specUrl}</Mono>,
          },
          {
            label: "Registry URL",
            value: <Mono tone="muted">{api.registryUrl}</Mono>,
          },
          ...(isSchema
            ? []
            : [
                { label: "SDK targets", value: String(api.sdkTargetCount) },
                { label: "Docs sites", value: String(api.docsProjectCount) },
                { label: "MCP servers", value: String(api.mcpServerCount) },
              ]),
          {
            label: "Last updated",
            value: shownVersion?.updatedAt ?? api.updatedAt,
          },
        ]}
      />
    </div>
  );
}
