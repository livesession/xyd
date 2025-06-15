import { useLocation, useNavigate } from "react-router";
import { useContext, useEffect, useMemo, memo } from "react";

import { Atlas } from "@xyd-js/atlas";

import { UrlContext, useGlobalState } from "~/context";
import { DOCS_PREFIX } from "~/const";

export default function Url() {
    const { actionData: globalActionData } = useGlobalState();
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (!globalActionData?.references?.length) {
            navigate("/")
        }
    }, [])

    if (!globalActionData?.references?.length) {
        return null
    }

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

    const references = [findRef]

    return <AtlasContent canonical={findRef.canonical} references={references} />
}

const AtlasContent = memo(({ canonical, references }: { canonical: string, references: any[] }) => {
    const { BaseThemePage } = useContext(UrlContext)

    return (
        <BaseThemePage>
            <Atlas
                kind="primary"
                references={references}
            />
        </BaseThemePage>
    )
}, (prevProps, nextProps) => prevProps.canonical === nextProps.canonical)
