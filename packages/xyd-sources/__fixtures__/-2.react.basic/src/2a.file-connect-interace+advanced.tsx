/**
 * Available font sizes for the Text component
 */
export type TextFontSizes = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";

/**
 * Available text styles/kinds for the Text component
 */
export type TextKindTypes = "default" | "ghost" | "success" | "warn" | "error" | "primary" | "secondary";

/**
 * Available font weights for the Text component
 */
export type TextFontWeights = "normal" | "bold" | "extra-bold";

/**
 * Props for the Text component
 */
export interface TextProps {
    /** Font size of the text */
    size?: TextFontSizes

    /** Visual style/kind of the text */
    kind?: TextKindTypes

    /** Font weight of the text */
    weight?: TextFontWeights

    /** Content to be rendered inside the text component */
    children?: React.ReactNode

    /** Additional CSS class name */
    className?: string

    /** HTML id attribute */
    id?: string

    /** Click event handler */
    onClick?: () => void
}

/**
 * A flexible text component that supports different sizes, styles, and weights.
 *
 * @category Component
 */
export function Text(props: TextProps) {
    return (
        <p>
            {props.children}
        </p>
    )
}

