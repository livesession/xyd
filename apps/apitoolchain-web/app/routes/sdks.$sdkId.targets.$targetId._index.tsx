import { DescriptionList, Menu, Mono } from "@apitoolchain/design-system";
import { useState } from "react";
import { useOutletContext } from "react-router";
import { RouterLink } from "~/components/RouterLink";
import { TagBadges } from "~/components/registryDetailShared";
import { SdkLangIcon } from "~/components/SdkLangIcon";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import type { SdkLanguage } from "~/data";
import { formatVersion } from "~/version";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

function installCmd(language: SdkLanguage, pkg: string): string {
  switch (language) {
    case "node":
      return `npm install ${pkg}`;
    case "python":
      return `pip install ${pkg}`;
    case "go":
      return `go get ${pkg}`;
    case "ruby":
      return `gem install ${pkg}`;
    case "java":
      return `implementation "${pkg}"`;
    case "dotnet":
      return `dotnet add package ${pkg}`;
  }
}

export default function SdkTargetOverviewTab() {
  const { target, label, apiName, base, ready, versions, registryConnections } =
    useOutletContext<SdkTargetContext>();
  // Version selector — pick which build's details to show.
  const [versionSel, setVersionSel] = useState(
    versions[0]?.version ?? target.version,
  );
  const shownVersion =
    versions.find((v) => v.version === versionSel) ?? versions[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-subtle">Version</span>
        <Menu
          variant="select"
          icon="tags-outline"
          label={formatVersion(shownVersion?.version)}
          items={versions.map((v) => ({
            key: v.version,
            label: formatVersion(v.version),
            active: v.version === shownVersion?.version,
            onSelect: () => setVersionSel(v.version),
          }))}
        />
      </div>
      <DescriptionList
        items={[
          {
            label: "Language",
            value: (
              <span className="inline-flex items-center gap-2 font-medium text-ink">
                <SdkLangIcon
                  language={target.language}
                  className="size-4 shrink-0"
                />
                {label}
              </span>
            ),
          },
          {
            label: "Package",
            value: <Mono>{target.packageName || "—"}</Mono>,
          },
          {
            label: "Version",
            value: formatVersion(shownVersion?.version ?? target.version),
          },
          {
            label: "Dist-tag",
            value: <TagBadges tags={shownVersion?.tags ?? []} />,
          },
          {
            label: "Output",
            value: <Mono tone="muted">{target.output}</Mono>,
          },
          {
            label: "API",
            value: (
              <RouterLink
                href={`/registry/${target.apiId}`}
                className="text-blue no-underline hover:underline"
              >
                {apiName}
              </RouterLink>
            ),
          },
          {
            label: "Published",
            value: shownVersion?.publishedAt ?? "Not published",
          },
          ...(shownVersion?.registryUrl
            ? [
                {
                  label: "Registry",
                  value: <Mono tone="muted">{shownVersion.registryUrl}</Mono>,
                },
              ]
            : []),
        ]}
      />
      {ready && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">Install</div>
          {registryConnections.length > 0 ? (
            <div className="rounded-control border border-line bg-surface-muted px-3 py-2.5">
              <Mono>
                {installCmd(target.language, target.packageName || label)}
              </Mono>
            </div>
          ) : (
            <p className="m-0 text-sm text-muted">
              Not on a package registry yet —{" "}
              <RouterLink
                href={`${base}/publishing`}
                className="text-blue no-underline hover:underline"
              >
                connect a package registry
              </RouterLink>{" "}
              to publish and install this SDK.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
