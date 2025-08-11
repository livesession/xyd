import React from "react";

import { NavigationItem } from "@xyd-js/core";
import { Icon } from "@xyd-js/components/writer";
import { UISidebar } from "@xyd-js/ui";

import { useAppearance } from "../contexts";

export function FwSidebarNavigationItem(item: NavigationItem) {
    const appearance = useAppearance()

    return <UISidebar.Item
        href={item.page || item.href}
        icon={React.isValidElement(item.icon) ? item.icon : <Icon name={item.icon || ""} />}
        key={keyId(item)}
    >
        <UISidebar.ItemBody
            title={item.title}
            right={appearance?.sidebar?.externalArrow && <Icon.ExternalArrow />}
        />
    </UISidebar.Item>
}

function keyId(props: NavigationItem) {
    return `${props?.title || props?.href || "."}-${props.page || ""}`
}