import React from "react";

import { WebEditorHeader } from "@xyd-js/core";
import { Icon } from "@xyd-js/components/writer";
import { Nav } from "@xyd-js/ui"

import { isExternal, pageLink } from "../utils";
import { useAppearance } from "../contexts";
import { FwJsonComponent, FwLink } from "../components";
import { useHeaderItems } from "../hooks";

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
    const Component = FwJsonComponent({
        component: props.component || "",
        props: {
            ...props.props || {},
            children: props.props?.children || props.title || "",
        }
    }) || props.title

    let href: string | null = null

    if (typeof props.href === "string") {
        href = pageLink(props.href)
    }

    if (!href && typeof props.page === "string") {
        href = pageLink(props.page)
    }

    const isExternalArrow = !props.component && appearance?.header?.externalArrow && isExternal(href || "") ? true : false;

    return <Nav.Item
        key={(props.page || "") + props.page}
        href={href}
        value={props.href ? undefined : props.page}
        as={FwLink}
    >
        {Component}

        {isExternalArrow ? <Icon.ExternalArrow /> : null}
    </Nav.Item>
}
