import {
  Badge,
  Button,
  EmptyState,
  Mono,
  StatusPill,
} from "@apitoolchain/design-system";
import { useFetcher, useOutletContext } from "react-router";
import { SdkLangIcon } from "~/components/SdkLangIcon";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import type { PackageRegistry, RegistryConnection, SdkLanguage } from "~/data";
import { REGISTRY_KIND_LABEL } from "~/lib/registryKind";
import { formatVersion } from "~/version";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export default function SdkTargetPublishingTab() {
  const { registryConnections, base, registries, ready, openPublish } =
    useOutletContext<SdkTargetContext>();

  if (registryConnections.length === 0) {
    return (
      <EmptyState
        icon="sdk"
        title="No publishers connected"
        description="Connect a publisher to publish the generated SDK to a package registry."
        action={
          <Button
            variant="secondary"
            icon="sdk"
            onClick={openPublish}
            disabled={!ready}
          >
            Connect a publisher
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {registryConnections.map((c) => (
        <TargetRegistryRow
          key={c.id}
          conn={c}
          actionPath={base}
          registries={registries}
        />
      ))}
      <div>
        <Button variant="secondary" size="sm" icon="sdk" onClick={openPublish}>
          Connect another publisher
        </Button>
      </div>
    </div>
  );
}

/** One registry connection: package + last-published + Publish/Remove. */
function TargetRegistryRow({
  conn,
  actionPath,
  registries,
}: {
  conn: RegistryConnection;
  actionPath: string;
  registries: PackageRegistry[];
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const status = busy ? "building" : (conn.lastPublishStatus ?? "draft");
  const registry = registries.find((r) => r.id === conn.registryId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <SdkLangIcon language={conn.language as SdkLanguage} />
        <Mono>{conn.packageName || conn.language}</Mono>
        {registry && (
          <Badge tone="neutral">{REGISTRY_KIND_LABEL[registry.kind]}</Badge>
        )}
        <StatusPill status={status} />
        {conn.lastPublishedVersion && (
          <span className="truncate text-subtle text-xs">
            {formatVersion(conn.lastPublishedVersion)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="publish-registry" />
          <input type="hidden" name="id" value={conn.id} />
          <Button
            variant="secondary"
            size="sm"
            icon="sdk"
            type="submit"
            disabled={busy}
          >
            {busy ? "Publishing…" : "Publish"}
          </Button>
        </fetcher.Form>
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="disconnect-registry" />
          <input type="hidden" name="id" value={conn.id} />
          <Button variant="ghost" size="sm" type="submit" disabled={busy}>
            Remove
          </Button>
        </fetcher.Form>
      </div>
      {conn.lastPublishError && (
        <div className="sr-only">{conn.lastPublishError}</div>
      )}
    </div>
  );
}
