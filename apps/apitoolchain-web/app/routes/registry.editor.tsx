import { lazy, Suspense, useEffect, useState } from "react";
import { redirect } from "react-router";
import { requireUser } from "~/auth.server";
import { fetchSpecRaw, getApi, listApis } from "~/data";
import { specTextToUniform } from "~/lib/openapi/toGroups.server";
// The coder stylesheet carries the code-sample language dropdown styles (a xyd
// component tweak). The theme bundle predates it, so pull the freshly-built
// component CSS too — loaded BEFORE the theme so the theme still wins shared
// codetabs rules; only the net-new dropdown rules come from here.
import coderCss from "../../../../packages/xyd-components/dist/index.css?url";
// The xyd theme stylesheet (sidebar + Atlas look), loaded ONLY on this route via
// `links()`, so it never affects the rest of the app. Relative path — xyd themes
// aren't installable here; the `@layer` order is pinned globally in app.css.
import openerCss from "../../../../packages/xyd-theme-opener/dist/index.css?url";
// Same reason as coderCss: the SDK-native reference styles (operation-header
// signature + language select) live in @xyd-js/atlas, but the theme bundle
// predates them — pull the freshly-built Atlas CSS so the net-new sdk-header
// rules apply (loaded AFTER the theme so the fresh Atlas wins any shared rule).
import atlasCss from "../../../../packages/xyd-atlas/dist/index.css?url";
import type { Route } from "./+types/registry.editor";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: coderCss },
  { rel: "stylesheet", href: openerCss },
  { rel: "stylesheet", href: atlasCss },
];

export function meta() {
  return [{ title: "Editor — apitoolchain" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  await requireUser();
  const [api, all] = await Promise.all([getApi(params.apiId), listApis()]);
  if (!api) throw new Response("Not Found", { status: 404 });
  // Only OpenAPI specs are editable — the header's API switcher lists api-kind
  // entries so you can jump between specs' editors.
  const apis = all.filter((a) => a.kind === "api");
  const version =
    params.version ??
    api.versions.find((v) => v.current)?.version ??
    api.versions[0]?.version ??
    "";
  // Always keep the version in the URL (shareable + refreshable). If the caller
  // hit /editor/:apiId with no version — e.g. the header's API switcher — send
  // them to the resolved default so the path is canonical. Guarded on `version`
  // so a spec with no versions doesn't loop.
  if (!params.version && version) {
    throw redirect(`/editor/${api.id}/${encodeURIComponent(version)}`);
  }
  const spec = await fetchSpecRaw(api.id, version);
  // Pre-compute the sidebar + references (+ source line positions) server-side.
  const { references, groups, error, positions } = await specTextToUniform(
    spec.text,
  );
  return {
    api,
    apis,
    version,
    specText: spec.text,
    references,
    groups,
    error,
    positions,
  };
}

// The editor body (Monaco + xyd Atlas + the xyd docs runtime) is browser-only —
// lazy-import it so SSR never evaluates those modules, and mount only after
// hydration. This app's first client-only boundary.
const EditorApp = lazy(() => import("~/editor/EditorApp"));

export default function EditorRoute({ loaderData }: Route.ComponentProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <EditorShell name={loaderData.api.name} />;
  return (
    <Suspense fallback={<EditorShell name={loaderData.api.name} />}>
      {/* Key by version so switching versions remounts the editor (fresh spec). */}
      <EditorApp key={loaderData.version} {...loaderData} />
    </Suspense>
  );
}

function EditorShell({ name }: { name: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-1 text-sm text-subtle">
      Loading editor for {name}…
    </div>
  );
}
