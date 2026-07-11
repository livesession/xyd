import {
  Collapse,
  EmptyState,
  Mono,
  StatusPill,
} from "@apitoolchain/design-system";
import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";
import { SDK_LANG_LABEL, SdkLangIcon } from "~/components/SdkLangIcon";
import { listSdkBuilds } from "~/data";
import { sdkBuildStatus } from "~/lib/sdkStatus";
import { formatVersion } from "~/version";
import type { Route } from "./+types/sdks.$sdkId.versions";

export { sdkDetailAction as action } from "~/lib/sdkDetailAction";

export async function loader({ params }: Route.LoaderArgs) {
  const builds = await listSdkBuilds(params.sdkId);
  return { builds };
}

/**
 * The SDK "Versions" tab: the platform's own SDK versioning. Each version is a
 * build of every target from one API spec version — shown as build history in
 * Collapse panels (newest open by default). Create one from the layout's
 * Actions panel ("New version").
 */
export default function SdkVersionsTab({ loaderData }: Route.ComponentProps) {
  const { builds } = loaderData;

  // Tail the logs while a build is running: revalidate the loader every ~1.5s
  // and STOP the instant nothing is building. Scoped to an active build (not a
  // background poll). A ref keeps the effect deps to just `building`.
  const revalidator = useRevalidator();
  const revalidate = useRef(revalidator.revalidate);
  revalidate.current = revalidator.revalidate;
  const building = builds.some((b) => b.status === "building");
  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => revalidate.current(), 1500);
    return () => clearInterval(t);
  }, [building]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-semibold text-ink">Versions</div>
        <p className="m-0 text-[13px] text-subtle">
          Each version is a build of every target from an API spec version.
          Create one from the Actions panel. Decoupled from the published
          per-target package versions.
        </p>
      </div>

      {builds.length === 0 ? (
        <EmptyState
          icon="sdk"
          title="No versions yet"
          description="Use “New version” in the Actions panel to build your SDK targets and start a history."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {builds.map((b, i) => (
            <Collapse
              key={b.id}
              icon="tags-outline"
              title={
                <span className="font-medium text-ink">
                  {formatVersion(b.version)}
                </span>
              }
              description={`API ${formatVersion(b.apiVersion)} · ${b.createdAt}`}
              trailing={
                <StatusPill status={sdkBuildStatus({ status: b.status })} />
              }
              defaultOpen={i === 0}
            >
              <div className="flex flex-col">
                <div className="flex flex-col divide-y divide-line-soft">
                  {b.targets.length === 0 ? (
                    <p className="m-0 py-2 text-[13px] text-muted">
                      No targets were in this build.
                    </p>
                  ) : (
                    b.targets.map((t) => (
                      <div
                        key={t.language}
                        className="flex items-center justify-between gap-2 py-2"
                      >
                        <span className="flex items-center gap-2">
                          <SdkLangIcon
                            language={t.language}
                            className="size-4 shrink-0"
                          />
                          <span className="text-body">
                            {SDK_LANG_LABEL[t.language]}
                          </span>
                        </span>
                        <Mono tone="muted">{t.packageName || "—"}</Mono>
                      </div>
                    ))
                  )}
                </div>
                {(b.logs.trim() || b.status === "building") && (
                  <div className="border-t border-line-soft pt-3">
                    <Collapse
                      icon="logs"
                      title="Logs"
                      trailing={
                        b.status === "building" ? (
                          <span className="text-[12px] text-muted">
                            building…
                          </span>
                        ) : undefined
                      }
                      defaultOpen={b.status === "building"}
                    >
                      <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-body">
                        {b.logs.trimEnd() || "waiting for logs…"}
                      </pre>
                    </Collapse>
                  </div>
                )}
              </div>
            </Collapse>
          ))}
        </div>
      )}
    </div>
  );
}
