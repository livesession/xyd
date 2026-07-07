import {
  Badge,
  type BadgeTone,
  Button,
  Collapse,
  Modal,
} from "@apitoolchain/design-system";
import { useFetcher } from "react-router";
import type { Release, ReleaseState, RepoConnection } from "~/data";

const STATE_TONE: Record<ReleaseState, BadgeTone> = {
  preparing: "info",
  pr_open: "info",
  merging: "info",
  released: "success",
  failed: "error",
  superseded: "neutral",
};
const STATE_LABEL: Record<ReleaseState, string> = {
  preparing: "Preparing",
  pr_open: "PR open",
  merging: "Merging",
  released: "Released",
  failed: "Failed",
  superseded: "Superseded",
};
const ACTIVE: ReleaseState[] = ["preparing", "pr_open", "merging"];

/**
 * The releases management surface for one connected repo — the rolling PR
 * status, changelog, publish, and history, plus the Prepare action. Rendered
 * standalone by {@link ReleasesModal} and as the "Releases" tab of the
 * repository modal. Prepare/Publish post to the owning route's action, which
 * revalidates the loader → this refreshes.
 */
export function ReleasesPanel({
  connection,
  releases,
  actionPath,
}: {
  connection: RepoConnection;
  releases: Release[];
  actionPath: string;
}) {
  const active = releases.find((r) => ACTIVE.includes(r.state));
  const history = releases.filter((r) => r.state === "released");
  const prepare = useFetcher();
  const preparing = prepare.state !== "idle";
  const prepareResult = prepare.data as
    | { ok?: boolean; message?: string }
    | undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-subtle">
          Versioned, PR-based{" "}
          {connection.targetKind === "spec" ? "spec" : "SDK"} releases
          {connection.prefix ? ` · ${connection.prefix}` : ""}. Prepare opens
          (or refreshes) the rolling PR from the latest spec; merging it tags +
          cuts a Release.
        </p>
        <prepare.Form method="post" action={actionPath} className="shrink-0">
          <input type="hidden" name="intent" value="prepare-release" />
          <input type="hidden" name="id" value={connection.id} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon="git"
            disabled={preparing}
          >
            {preparing ? "Preparing…" : "Prepare release"}
          </Button>
        </prepare.Form>
      </div>
      {prepareResult && prepareResult.ok === false && (
        <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {prepareResult.message}
        </div>
      )}

      {active ? (
        <ActiveRelease release={active} actionPath={actionPath} />
      ) : (
        <div className="rounded-control border border-line bg-surface-muted p-4 text-sm text-subtle">
          No active release. <strong>Prepare release</strong> opens the rolling
          PR from the latest spec version.
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink">Released</div>
          <div className="flex flex-col gap-2">
            {history.map((r) => (
              <Collapse
                key={r.id}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Manage releases for one connected repo, in place. Opened from the connection's
 * row on the SDK target page. Thin wrapper over {@link ReleasesPanel}.
 */
export function ReleasesModal({
  open,
  onClose,
  connection,
  releases,
  actionPath,
}: {
  open: boolean;
  onClose: () => void;
  connection: RepoConnection;
  releases: Release[];
  actionPath: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Releases · ${connection.repo}`}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ReleasesPanel
        connection={connection}
        releases={releases}
        actionPath={actionPath}
      />
    </Modal>
  );
}

function ActiveRelease({
  release,
  actionPath,
}: {
  release: Release;
  actionPath: string;
}) {
  const publish = useFetcher();
  const publishing = publish.state !== "idle";
  const publishResult = publish.data as
    | { ok?: boolean; message?: string }
    | undefined;
  const versionLabel = release.fromVersion
    ? `v${release.fromVersion} → v${release.toVersion}`
    : `Initial · v${release.toVersion}`;
  return (
    <Collapse
      icon="git"
      title={versionLabel}
      description={`spec ${release.baseSpecVersion || "∅"} → ${
        release.headSpecVersion
      } · ${release.changeCount} change(s)`}
      defaultOpen
      trailing={
        <span className="flex items-center gap-1.5">
          <Badge tone={STATE_TONE[release.state]}>
            {STATE_LABEL[release.state]}
          </Badge>
          {release.bumpType && release.bumpType !== "none" && (
            <Badge tone="neutral">{release.bumpType}</Badge>
          )}
          {release.breakingCount > 0 && (
            <Badge tone="error">{release.breakingCount} breaking</Badge>
          )}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>
            {release.prNumber ? `PR #${release.prNumber}` : "No PR yet"}
          </span>
          <div className="flex items-center gap-2">
            {release.prUrl && (
              <a
                href={release.prUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue no-underline hover:underline"
              >
                Open PR ↗
              </a>
            )}
            {release.state === "pr_open" && (
              <publish.Form method="post" action={actionPath}>
                <input type="hidden" name="intent" value="publish-release" />
                <input type="hidden" name="id" value={release.id} />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={publishing}
                >
                  {publishing ? "Publishing…" : "Publish"}
                </Button>
              </publish.Form>
            )}
          </div>
        </div>
      }
    >
      {publishResult && publishResult.ok === false && (
        <div className="mb-3 rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {publishResult.message}
        </div>
      )}
      {release.error && (
        <div className="mb-3 rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {release.error}
        </div>
      )}
      {release.changelog ? (
        <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap text-[12px] text-ink">
          {release.changelog}
        </pre>
      ) : (
        <span className="text-subtle">No changelog yet.</span>
      )}
    </Collapse>
  );
}
