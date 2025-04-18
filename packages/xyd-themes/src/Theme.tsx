import React from "react"

import { useMetadata } from "@xyd-js/framework/react";

import { metaComponent } from './decorators';
import { Check } from "./Check";

interface MDMeta {

}

interface AtlasMeta extends MDMeta {
    example: string
}

export abstract class Theme {
    protected useHideToc() {
        const meta = useMetadata()

        if (!meta) {
            return false
        }

        switch (meta.layout) {
            case "wide":
                return true
            case "center":
                return true
            default:
                return false
        }
    }

    protected useLayoutSize() {
        const meta = useMetadata()

        if (!meta) {
            return undefined
        }

        switch (meta.layout) {
            case "wide":
                return "large"
            default:
                return undefined
        }
    }

    @metaComponent("atlas", "Atlas")
    private atlasMetaComponent(
        props: any,
        meta: AtlasMeta
    ) { // TODO: support async?
        console.log("IM INVOKED FROM META3333333", props, meta)

        return props
        // TODO: in the future return a component directly here but we need good mechanism for transpiling?
    }

    public components() {
        return {
            Atlas2: Atlas
        }
    }
}

function Atlas(props) {
    console.log("IM INSIDE COMPONENT33", props)

    return <div>
        Hello World
    </div>
}