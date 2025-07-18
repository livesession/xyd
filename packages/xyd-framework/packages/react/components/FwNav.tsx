import React, { } from "react";

import { Nav } from "@xyd-js/ui"
import {
    ColorSchemeButton,
} from "@xyd-js/components/writer";
import { LayoutPrimary } from "@xyd-js/components/layouts";

import { SurfaceTarget } from "../../../src";
import { useActivePage, useDefaultHeaderItems } from "../hooks";
import { Surface } from "./Surfaces";
import { FwLogo } from "./FwLogo";
import { FwHeaderItem, FwHeaderItems } from "./FwHeaderItems";
import { useAppearance } from "../contexts";
import { WebEditorComponent } from "./WebEditorComponent";

// TODO: renamte to FwHeader ?
export function FwNav() {
    const activeHeaderPage = useActivePage()
    const appearance = useAppearance()

    const Header = FwHeaderItems()
    const logo = appearance?.logo?.header ? <WebEditorComponent.NavItemRaw
        device={appearance?.logo?.header}
    >
        <FwLogo />
    </WebEditorComponent.NavItemRaw> : null

    // TODO: in the future better floating system - just pure css?
    return <Nav
        appearance={{
            separator: appearance?.header?.separator || undefined
        }}
        logo={logo}
        centerSurface={
            Header?.center?.length ? <>
                <Nav.Tabs
                    value={activeHeaderPage}
                >
                    {Header.center}
                </Nav.Tabs>
            </> : null
        }
        rightSurface={<>
            {
                Header?.right?.length
                    ? <Nav.Tabs
                        value={activeHeaderPage}
                    >
                        {Header.right}
                    </Nav.Tabs>
                    : null
            }

            <Surface target={SurfaceTarget.NavRight} />
        </>
        }
        floatRightSurface={<>
            <Nav.ItemRaw>
                <ColorSchemeButton />
            </Nav.ItemRaw>
            <Nav.ItemRaw>
                <LayoutPrimary.Hamburger />
            </Nav.ItemRaw>
        </>}
    >
        <FwNav.DefaultItems />
    </Nav>
}

FwNav.DefaultItems = function DefaultItems() {
    const activeHeaderPage = useActivePage()
    const defaultItems = useDefaultHeaderItems()

    const items = defaultItems.map(FwHeaderItem)

    return <Nav.Tabs
        value={activeHeaderPage}
    >
        {items}
    </Nav.Tabs>
}

