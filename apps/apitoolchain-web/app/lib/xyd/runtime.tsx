import { Atlas } from "@xyd-js/atlas";
import { ReactContent } from "@xyd-js/components/content";
import { Badge } from "@xyd-js/components/writer";
import { Surfaces } from "@xyd-js/framework";
import { FwLink } from "@xyd-js/framework/react";
import ThemeOpener from "@xyd-js/theme-opener";
import { useLocation, useNavigate, useNavigation } from "react-router";
import { EDITOR_SETTINGS } from "./editor-settings";

/**
 * Hand-wires the xyd docs runtime the OpenAPI editor's sidebar needs — exactly
 * how `apps/apidocs-demo/app/routes/layout.tsx` does it without booting
 * `xyd dev`. CLIENT-ONLY (imported from the lazily-mounted editor body), so the
 * `globalThis` writes + theme instance never touch SSR.
 */

// biome-ignore lint/suspicious/noExplicitAny: xyd runtime types aren't aliased.
type Loose = any;

const g = globalThis as Record<string, unknown>;

/** The `sidebar.item.right` Surface — an HTTP-method badge read from the
 * `meta.openapi = "#GET /path"` stamp `toGroups` writes. */
function SidebarItemRight(props: Loose) {
  const openapi: string = props?.pageMeta?.openapi || "";
  const [, region = ""] = openapi.includes("#")
    ? openapi.split("#")
    : ["", openapi];
  const [method = ""] = region.split(" ");
  if (!method) return null;
  let methodText = method.toUpperCase();
  if (method === "DELETE") methodText = "DEL";
  return (
    <div
      data-active={props?.active ? "true" : undefined}
      data-atlas-oas-method={method}
    >
      <Badge size="xs">{methodText}</Badge>
    </div>
  );
}

export const surfaces = new Surfaces();
surfaces.define("sidebar.item.right", SidebarItemRight);

const reactContent = new ReactContent(
  EDITOR_SETTINGS as Loose,
  {
    Link: FwLink,
    components: { Atlas },
    useLocation,
    useNavigate,
    useNavigation,
  } as Loose,
);

// The xyd runtime reads these globals (theme/nav/content). Server-global in this
// demo-style wiring, same caveat as apidocs-demo — fine for a single-user editor.
g.__xydThemeSettings = EDITOR_SETTINGS.theme;
g.__xydSettingsClone = JSON.parse(JSON.stringify(EDITOR_SETTINGS));
g.__xydNavigation = EDITOR_SETTINGS.navigation;
g.__xydWebeditor = EDITOR_SETTINGS.webeditor;
g.__xydReactContent = reactContent;
g.__xydSurfaces = surfaces;

/** The opener theme instance (drives the sidebar + Atlas look). */
export const theme = new ThemeOpener();

export { EDITOR_SETTINGS };
