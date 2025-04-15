import React, {useState} from "react"
import {Copy, CheckCheck} from "lucide-react"

import * as cn from "./CodeCopy.styles"

export interface CodeCopyProps {
    text: string
}

export function CodeCopy({text}: CodeCopyProps) {
    const [copied, setCopied] = useState(false)

    function onClick() {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
        }, 1200)
    }

    return (
        <button
            data-element="xyd-code-copy"
            className={cn.CodeCopyHost}
            aria-label="Copy to clipboard"
            onClick={onClick}
        >
            {copied ? <CheckCheck size={16}/> : <Copy size={16}/>}
        </button>
    )
}