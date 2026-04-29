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