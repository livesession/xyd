import React from "react";

import { Breadcrumbs } from "@xyd-js/components/writer";

import { useBreadcrumbs, useAppearance } from "../contexts";
import { useAsTocActiveSection } from "../lib";
import { displayBreadcrumbs } from "../utils";
import { FwLink } from "./FwLink";

export function FwBreadcrumbs() {
    const fwBreadcrumbs = useBreadcrumbs()
    const appearance = useAppearance()

    // sidebar-as-TOC host page: the static breadcrumbs are empty (the host is
    // an index page), so follow the section being READ instead — the scroll-spy
    // publishes "Group / Section" and this re-renders as the reader scrolls.
    // Effect-driven (null during SSR/hydration), disabled per group via
    // `asToc: { breadcrumbs: false }`.
    const asTocSection = useAsTocActiveSection()

    let items = (fwBreadcrumbs as any) || []
    if (asTocSection?.breadcrumbs && asTocSection.title) {
        items = [
            ...(asTocSection.group ? [{ title: asTocSection.group, href: "" }] : []),
            { title: asTocSection.title, href: asTocSection.href },
        ]
    }

    // `content.breadcrumbs` is `boolean | { links?, rootLevel? }` (both default true):
    // links:false → plain text; rootLevel:false → drop the top tab/route crumb.
    const breadcrumbs = displayBreadcrumbs(
        items,
        appearance?.content?.breadcrumbs,
    )

    return <Breadcrumbs
        items={breadcrumbs}
        as={FwLink}
    />
}
