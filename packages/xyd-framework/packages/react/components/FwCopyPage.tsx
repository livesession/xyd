import React, { useState } from "react";

import { Button, Icon } from "@xyd-js/components/writer";
import { useUXEvents } from "@xyd-js/analytics";

import { useRawPage } from "../contexts";

export function FwCopyPage() {
    const [isCopied, setIsCopied] = useState(false)

    const rawPage = useRawPage()
    const ux = useUXEvents()

    const handleCopy = () => {
        navigator.clipboard.writeText(rawPage || "")
        setIsCopied(true)
        ux.docs.copy_page({})
        setTimeout(() => setIsCopied(false), 2000)
    }

    // TODO: IconCheck and IconCopy itself
    return <Button icon={isCopied ? <Icon name="check" size={12} /> : <Icon name="copy" size={12} />}
        onClick={handleCopy}>
        Copy page
    </Button>
}