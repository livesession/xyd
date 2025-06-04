import {Kind} from "./4.outside-interface2";

/**
 * A card component that displays content with a title and optional icon.
 * The entire card is clickable and links to the specified URL.
 *
 * @category Component
 */
export function GuideCard({children, kind = "primary"}: {
    /** Content to be displayed in the card body */
    children: React.ReactNode;

    /** Visual style variant of the card */
    kind?: Kind
}) {
    return <div>
        {children}
    </div>
}
