import {
  Badge,
  Button,
  Collapse,
  EmptyState,
  Icon,
  Mono,
  StatusPill,
} from "@apitoolchain/design-system";
import { useEffect, useRef } from "react";
import { useFetcher, useOutletContext, useRevalidator } from "react-router";
import { DeleteConfirm } from "~/components/DeleteConfirm";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import type { PackageRegistry, RegistryConnection, Release } from "~/data";
import {
  packageRegistryUrl,
  REGISTRY_KIND_ICON,
  REGISTRY_KIND_LABEL,
} from "~/lib/registryKind";
import { formatVersion } from "~/version";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export default function SdkTargetPublishingTab() {
  const {
    registryConnections,
    base,
    registries,
    ready,
    openPublish,
    releasesByConn,
  } = useOutletContext<SdkTargetContext>();

  // Poll while any connection is mid-publish — the publish runs off-request and
  // streams its log; stop the instant nothing is publishing.
  const publishing = registryConnections.some(
    (c) => c.lastPublishStatus === "building",
  );
  const revalidator = useRevalidator();
  const revalidate = useRef(revalidator.revalidate);
  revalidate.current = revalidator.revalidate;
  useEffect(() => {
    if (!publishing) return;
    const t = setInterval(() => revalidate.current(), 1500);
    return () => clearInterval(t);
  }, [publishing]);

  // The target's cut releases (across its repo connections) — shown in the same
  // Collapse pattern as the registry's Releases tab.
  const releases = Object.values(releasesByConn)
    .flat()
    .filter((r) => r.state === "released");

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {registryConnections.map((c) => (
          <PublisherPanel
            key={c.id}
            conn={c}
            actionPath={base}
            registry={registries.find((r) => r.id === c.registryId)}
          />
        ))}
      </div>

      {releases.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">Releases</div>
          <div className="flex flex-col gap-2">
            {releases.map((r) => (
              <ReleaseEntry key={r.id} release={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One registry connection as a Collapse: package + status in the header,
 * Publish/Remove/link pinned to the header (always reachable, never toggling),
 * and the PUBLISHER's log tailing in the body. */
function PublisherPanel({
  conn,
  actionPath,
  registry,
}: {
  conn: RegistryConnection;
  actionPath: string;
  registry: PackageRegistry | undefined;
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const publishing = busy || conn.lastPublishStatus === "building";
  const status = publishing ? "building" : (conn.lastPublishStatus ?? "draft");
  const pkgLabel = conn.packageName || conn.language;
  const kindLabel = registry
    ? REGISTRY_KIND_LABEL[registry.kind]
    : conn.language;
  const pkgUrl = registry
    ? packageRegistryUrl(registry, conn.packageName)
    : null;
  const logs = (conn.publishLogs ?? "").trimEnd();

  return (
    <Collapse
      icon={registry ? REGISTRY_KIND_ICON[registry.kind] : "sdk"}
      // Package link first, then the status + version (the whole row is the
      // toggle; the link opens the package instead of toggling).
      title={
        <span className="flex min-w-0 items-center gap-2">
          {pkgUrl ? (
            <a
              href={pkgUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Open ${pkgLabel} on ${kindLabel}`}
              className="inline-flex min-w-0 items-center gap-1 font-mono text-[13px] text-blue no-underline hover:underline"
            >
              <span className="truncate">{pkgLabel}</span>
              <Icon icon="externalLink" size={12} />
            </a>
          ) : (
            <Mono>{pkgLabel}</Mono>
          )}
          <StatusPill status={status} />
          {conn.lastPublishedVersion && (
            <span className="shrink-0 text-subtle text-xs">
              {formatVersion(conn.lastPublishedVersion)}
            </span>
          )}
        </span>
      }
      description={registry ? `${kindLabel} · ${registry.name}` : kindLabel}
      // Auto-open while publishing so the live log is right there; collapse when
      // settled to stay compact with many connections.
      defaultOpen={publishing}
      headerAction={
        <>
          <fetcher.Form method="post" action={actionPath} className="contents">
            <input type="hidden" name="intent" value="publish-registry" />
            <input type="hidden" name="id" value={conn.id} />
            <Button
              variant="ghost"
              size="sm"
              icon="sdk"
              type="submit"
              disabled={publishing}
            >
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </fetcher.Form>
          <DeleteConfirm
            title="Remove registry connection"
            description={`Stop publishing ${pkgLabel} to this registry?`}
            confirmLabel="Remove"
            confirming={busy}
            busyLabel="Removing…"
            onConfirm={() =>
              fetcher.submit(
                { intent: "disconnect-registry", id: conn.id },
                { method: "post", action: actionPath },
              )
            }
            trigger={(open) => (
              <Button
                variant="danger-ghost"
                size="sm"
                icon="trash"
                onClick={open}
                disabled={publishing}
              >
                Remove
              </Button>
            )}
          />
        </>
      }
    >
      <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] text-body leading-relaxed">
        {logs ||
          (publishing
            ? "publishing…"
            : "No publish yet — hit Publish to push to the registry.")}
      </pre>
    </Collapse>
  );
}

/** A cut release as a Collapse — mirrors the registry Releases tab's history. */
function ReleaseEntry({ release: r }: { release: Release }) {
  return (
    <Collapse
      icon="git"
      title={r.tag || `v${r.toVersion}`}
      description={`${
        r.bumpType && r.bumpType !== "none" ? `${r.bumpType} · ` : ""
      }${r.updatedAt}`}
      trailing={
        r.breakingCount > 0 ? (
          <Badge tone="error">{r.breakingCount} breaking</Badge>
        ) : null
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>
            spec {r.baseSpecVersion || "∅"} → {r.headSpecVersion} ·{" "}
            {r.changeCount} change(s)
          </span>
          {r.releaseUrl && (
            <a
              href={r.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue no-underline hover:underline"
            >
              View release ↗
            </a>
          )}
        </div>
      }
    >
      {r.changelog ? (
        <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap text-[12px] text-ink">
          {r.changelog}
        </pre>
      ) : (
        <span className="text-subtle">No changelog recorded.</span>
      )}
    </Collapse>
  );
}
