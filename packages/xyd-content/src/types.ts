import { HighlightedCode } from "codehike/code"

export type VarCode = [
    [
        string,
        ...(HighlightedCode)[]
    ] | HighlightedCode
]