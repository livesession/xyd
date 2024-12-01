import React, {useState} from "react"
import {Copy, CopyCheck, CheckCheck} from "lucide-react"

import {
    $copy
} from "./CodeCopy.style"

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
            aria-label="Copy to clipboard"
            onClick={onClick}
            className={$copy.host}
        >
            {copied ? <CheckCheck size={16}/> : <Copy size={16}/>}
        </button>
    )
}