import {
  Collapse,
  DescriptionList,
  Dropdown,
  Mono,
} from "@apitoolchain/design-system";
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
  const {
    target,
    label,
    apiName,
    base,
    ready,
    sdkVersion,
    versions,
    registryConnections,
    openPublish,
    sdkJson,
  } = useOutletContext<SdkTargetContext>();
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
        <Dropdown
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
            label: "SDK version",
            value: formatVersion(sdkVersion),
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
            label: "API version",
            value: formatVersion(target.apiVersion),
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
            // The published package name lives on the publisher connection
            // (decoupled from our internal target name). No publisher yet → a
            // link to connect one, since the package name is set there.
            label: "Package name",
            value:
              registryConnections.length > 0 ? (
                <Mono>{registryConnections[0].packageName || "—"}</Mono>
              ) : (
                <button
                  type="button"
                  onClick={openPublish}
                  className="cursor-pointer text-blue hover:underline"
                >
                  Connect a publisher
                </button>
              ),
          },
          {
            label: "Published",
            value: shownVersion?.publishedAt ?? "Not published",
          },
        ]}
      />
      {ready && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">Install snippet</div>
          {registryConnections.length > 0 ? (
            <div className="rounded-control border border-line bg-surface-muted px-3 py-2.5">
              <Mono>
                {installCmd(
                  target.language,
                  // The PUBLISHED package name (per registry) — decoupled from
                  // our internal target name, which may not be what's on npm/pypi.
                  registryConnections[0].packageName ||
                    target.packageName ||
                    label,
                )}
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
      {/* The regen config is an advanced detail — kept out of the way behind a
          collapsed disclosure rather than dumped upfront. */}
      {sdkJson && (
        <Collapse
          icon="settings"
          title={<span className="font-medium text-ink">sdk.json</span>}
          description="Regeneration config — a bare opensdk generate re-fetches the API and rebuilds this SDK."
        >
          <pre className="m-0 max-h-96 overflow-auto rounded-control border border-line bg-surface-muted px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink">
            {sdkJson}
          </pre>
        </Collapse>
      )}
    </div>
  );
}
