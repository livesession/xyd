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

// TODO: renamte to FwHeader ?
export function FwNav() {
    const activeHeaderPage = useActivePage()
    const Header = FwHeaderItems()

    // TODO: in the future better floating system - just pure css?
    return <Nav
        value={activeHeaderPage}
        logo={<FwLogo />}
        centerSurface={
            Header?.center?.length ? <>
                <Nav.Tab
                    value={activeHeaderPage}
                >
                    {Header.center}
                </Nav.Tab>
            </> : null
        }
        rightSurface={<>
            {
                Header?.right?.length
                    ? <div data-desktop>
                        <Nav.Tab
                            value={activeHeaderPage}
                        >
                            {Header.right}
                        </Nav.Tab>
                    </div>
                    : null
            }

            <Surface target={SurfaceTarget.NavRight} />

            <ColorSchemeButton />
            <LayoutPrimary.Hamburger />
        </>}
    >
        <FwNav.DefaultItems />
    </Nav>
}

FwNav.DefaultItems = function DefaultItems() {
    const defaultItems = useDefaultHeaderItems()

    return defaultItems.map(FwHeaderItem)
}

