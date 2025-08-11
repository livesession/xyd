/**
 * Base interface for all Details component variants
 */
export interface BaseDetailsProps {
    /** Content to be displayed inside the details element */
    children: React.ReactNode;

    /** Label text displayed in the summary */
    label: string;

    /** Optional icon element to be displayed in the summary */
    icon?: React.ReactElement;

    /** Optional CSS class name for custom styling */
    className?: string;
}

/**
 * Props for the tertiary variant of the Details component
 */
export interface TertiaryDetailsProps extends BaseDetailsProps {
    /** Specifies the tertiary variant */
    kind: "tertiary";

    /** Title text or element displayed in the summary */
    title: string | React.ReactNode;
}

/**
 * Props for the secondary variant of the Details component
 */
export interface SecondaryDetailsProps extends BaseDetailsProps {
    /** Specifies the secondary variant */
    kind: "secondary";

    /** Title text or element displayed in the summary */
    title: string | React.ReactNode;
}

/**
 * Props for the primary variant of the Details component
 */
export interface PrimaryDetailsProps extends BaseDetailsProps {
    /** Specifies the primary variant (default) */
    kind?: "primary";
}

/** Union type of all possible Details component variants */
export type DetailsProps = PrimaryDetailsProps | SecondaryDetailsProps | TertiaryDetailsProps

/**
 * A collapsible details component that supports three variants: primary, secondary, and tertiary.
 * Each variant has a different visual style and structure.
 *
 * @param props - The component props
 * @returns A details element with collapsible content
 *
 * @category Component
 */
export function Details(props: DetailsProps): React.ReactElement {
    return <div>
        {props.children}
    </div>
}



