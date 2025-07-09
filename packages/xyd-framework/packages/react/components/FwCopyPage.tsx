import React, {useState} from "react";

import {Button, Icon} from "@xyd-js/components/writer";

import {useRawPage} from "../contexts";

export function FwCopyPage() {
    const [isCopied, setIsCopied] = useState(false)

    const rawPage = useRawPage()
    // const events = useEvents()

    const handleCopy = () => {
        navigator.clipboard.writeText(rawPage || "")
        setIsCopied(true)
        // events.CopyPage({}) TODO: finish this

        setTimeout(() => setIsCopied(false), 2000)
    }

    // TODO: IconCheck and IconCopy itself
    return <Button icon={isCopied ? <Icon name="check" size={12}/> : <Icon name="copy" size={12}/>}
                   onClick={handleCopy}>
        Copy page
    </Button>
}