/**
 * Kind of card style to apply.
 */
export type Kind = "primary" | "secondary"

/**
 * Props for the GuideCard component
 */
export interface GuideCardProps {
    /** Content to be displayed in the card body */
    children: React.ReactNode;

    /** Visual style variant of the card */
    kind?: Kind
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

