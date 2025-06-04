/**
 * Props for the GuideCard component
 */
export interface GuideCardProps {
    /** Content to be displayed in the card body */
    children: React.ReactNode;

    /** URL the card links to */
    href: string

    /** Title displayed at the top of the card */
    title: string;

    /** Optional icon displayed to the left of the content */
    icon?: React.ReactNode;

    /** Visual style variant of the card */
    kind?: "secondary"

    /** Size variant of the card */
    size?: "sm" | "md"

    /** Additional CSS class names to apply to the card */
    className?: string

    /** Additional props to pass to the link element */
    as?: React.ElementType
}

/**
 * A card component that displays content with a title and optional icon.
 * The entire card is clickable and links to the specified URL.
 *
 * @category Component
 */
export function GuideCard(props: GuideCardProps) {
    return <div>
        {props.children}
    </div>
}

