import React, { useState } from "react"
import { Copy, CheckCheck } from "lucide-react"

import { useUXEvents } from "../../uxEvents"

import * as cn from "./CodeCopy.styles"

export interface CodeCopyProps {
    text: string
}

export function CodeCopy({ text }: CodeCopyProps) {
    const [copied, setCopied] = useState(false)
    const ux = useUXEvents()

    function onClick() {
        navigator.clipboard.writeText(text)
        setCopied(true)
        ux.CodeCopy({ code: text })
        setTimeout(() => {
            setCopied(false)
        }, 1200)
    }

    return <xyd-code-copy>
        <button
            part="button"
            className={cn.CodeCopyHost}
            aria-label="Copy to clipboard"
            onClick={onClick}
        >
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
        </button>
    </xyd-code-copy>

}