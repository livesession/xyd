import React from "react";

import { WebEditorHeader } from "@xyd-js/core";
import { Icon } from "@xyd-js/components/writer";
import { Nav } from "@xyd-js/ui"

import { isExternal, pageLink } from "../utils";
import { useAppearance } from "../contexts";
import { FwJsonComponent, FwLink } from "../components";
import { useHeaderItems } from "../hooks";
import { WebEditorComponent } from "./WebEditorComponent";

export function FwHeaderItems() {
    const headerItems = useHeaderItems()

    return Object.entries(headerItems).reduce<Record<"default" | "center" | "right", React.ReactNode[]>>((acc, [key, value]) => {
        return {
            ...acc,
            [key]: value.map(FwHeaderItem)
        }
    }, {
        default: [],
        center: [],
        right: [],
    })
}

export function FwHeaderItem(props: WebEditorHeader) {
    const appearance = useAppearance()

    let href: string | null = null

    if (typeof props.href === "string") {
        href = pageLink(props.href)
    }

    if (!href && typeof props.page === "string") {
        href = pageLink(props.page)
    }

    const isExternalArrow = !props.component && appearance?.header?.externalArrow && isExternal(href || "") ? true : false;

    const WebEditorHeader = WebEditorComponent(Nav.Item, {
        key: props.page || "",
        href: href,
        value: props.href ? undefined : props.page,
        as: FwLink,
    }, props.title)

    return <WebEditorHeader
        {...props}
    >
        {isExternalArrow ? <Icon.ExternalArrow /> : null}
    </WebEditorHeader>
}
