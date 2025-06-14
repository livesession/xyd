import { useLocation } from "react-router";

import { Atlas } from "@xyd-js/atlas";

import { UrlContext, useGlobalState } from "~/context";
import { DOCS_PREFIX } from "~/const";
import { createContext, useContext } from "react";

export default function Url() {
    const { actionData: globalActionData } = useGlobalState();
    const location = useLocation()
    const { BaseThemePage } = useContext(UrlContext)

    const findRef = globalActionData?.references?.find(ref => {
        let canonical = ref.canonical.startsWith("/") ? ref.canonical : `/${ref.canonical}`
        if (canonical.endsWith("/")) {
            canonical = canonical.slice(0, -1)
        }
        canonical = canonical.startsWith(DOCS_PREFIX) ? canonical : `${DOCS_PREFIX}${canonical}`

        return canonical === location.pathname
    })

    if (!findRef) {
        return null
    }

    console.log(BaseThemePage, "BaseThemePage")
    const references = [findRef]
    return <BaseThemePage>
    <Atlas
        kind="primary"
        references={references}
    />
    </BaseThemePage>
}