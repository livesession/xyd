import type { AppearanceContent } from "@xyd-js/core";
import type { IBreadcrumb } from "@xyd-js/ui";

/**
 * Apply the `content.breadcrumbs` display options to a resolved trail. Pure, so
 * the render component (`FwBreadcrumbs`) stays trivial and this stays
 * unit-testable: `links:false` strips every href (all text); `rootLevel:false`
 * drops the top (tab/route) crumb. Both default `true`; a bare boolean uses the
 * defaults.
 */
export function displayBreadcrumbs(
    items: IBreadcrumb[],
    option: AppearanceContent["breadcrumbs"],
): IBreadcrumb[] {
    const links = typeof option === "object" ? option.links ?? true : true;
    const rootLevel = typeof option === "object" ? option.rootLevel ?? true : true;

    let out = (items || []).map((item) => ({ title: item.title, href: links ? item.href : "" }));
    if (!rootLevel && out.length) out = out.slice(1);
    return out;
}
