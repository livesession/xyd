import {
  Badge,
  Button,
  EmptyState,
  Link,
  Mono,
  StatusPill,
} from "@apitoolchain/design-system";
import { useState } from "react";
import { useFetcher, useOutletContext } from "react-router";
import { ReleaseSettingsModal } from "~/components/ReleaseSettingsModal";
import { ReleasesModal } from "~/components/ReleasesModal";
import type { SdkTargetContext } from "~/components/sdkTargetShared";
import type { GitProvider, Release, RepoConnection } from "~/data";
import { repoWebUrl } from "~/lib/repoUrl";

export { sdkTargetAction as action } from "~/lib/sdkTargetAction";

export default function SdkTargetRepositoryTab() {
  const { connections, base, providers, releasesByConn, ready, openConnect } =
    useOutletContext<SdkTargetContext>();

  if (connections.length === 0) {
    return (
      <EmptyState
        icon="git"
        title="No repositories connected"
        description="Push the generated SDK into a connected git repo."
        action={
          <Button
            variant="secondary"
            icon="git"
            onClick={openConnect}
            disabled={!ready}
          >
            Connect repo
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {connections.map((c) => (
        <TargetRepoRow
          key={c.id}
          conn={c}
          actionPath={base}
          providers={providers}
          releases={releasesByConn[c.id] ?? []}
        />
      ))}
      <div>
        <Button variant="secondary" size="sm" icon="git" onClick={openConnect}>
          Connect another repo
        </Button>
      </div>
    </div>
  );
}

/** One repo connection on the SDK target page: repo + status + Sync/Remove. */
function TargetRepoRow({
  conn,
  actionPath,
  providers,
  releases,
}: {
  conn: RepoConnection;
  actionPath: string;
  providers: GitProvider[];
  releases: Release[];
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const status = busy ? "building" : (conn.lastSyncStatus ?? "draft");
  const release = conn.releaseMode === "release";
  const [cfgOpen, setCfgOpen] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const href = repoWebUrl(
    providers.find((p) => p.id === conn.providerId),
    conn.repo,
  );
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {href ? (
          <Link href={href} mono>
            {conn.repo}
          </Link>
        ) : (
          <Mono>{conn.repo}</Mono>
        )}
        {release ? (
          <Badge tone="info">release</Badge>
        ) : (
          <StatusPill status={status} />
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {release ? (
          <Button
            variant="ghost"
            size="sm"
            icon="bolt"
            onClick={() => setRelOpen(true)}
          >
            Releases
          </Button>
        ) : (
          <fetcher.Form method="post" action={actionPath} className="contents">
            <input type="hidden" name="intent" value="sync-repo" />
            <input type="hidden" name="id" value={conn.id} />
            <Button
              variant="secondary"
              size="sm"
              icon="git"
              type="submit"
              disabled={busy}
            >
              {busy ? "Syncing…" : "Sync"}
            </Button>
          </fetcher.Form>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon="settings"
          onClick={() => setCfgOpen(true)}
        >
          Settings
        </Button>
        <fetcher.Form method="post" action={actionPath} className="contents">
          <input type="hidden" name="intent" value="disconnect-repo" />
          <input type="hidden" name="id" value={conn.id} />
          <Button variant="ghost" size="sm" type="submit" disabled={busy}>
            Remove
          </Button>
        </fetcher.Form>
      </div>
      <ReleaseSettingsModal
        open={cfgOpen}
        onClose={() => setCfgOpen(false)}
        connection={conn}
        actionPath={actionPath}
      />
      <ReleasesModal
        open={relOpen}
        onClose={() => setRelOpen(false)}
        connection={conn}
        releases={releases}
        actionPath={actionPath}
      />
    </div>
  );
}
