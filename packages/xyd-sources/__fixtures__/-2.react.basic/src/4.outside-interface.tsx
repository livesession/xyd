import type {GuideCardProps} from "./4.outside-interface2";

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
