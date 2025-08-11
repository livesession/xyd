export interface DetailsProps {
    /** Content to be displayed inside the details element */
    children: React.ReactNode;

    /** Label text displayed in the summary */
    label: string;

    /** Optional icon element to be displayed in the summary */
    icon?: React.ReactElement;

    /** Optional CSS class name for custom styling */
    className?: string;

    /**
     * Which visual style to use.
     * @default 'primary'
     */
    kind?: 'primary' | 'secondary' | 'tertiary';

    /**
     * Title text or element displayed in the summary.
     * Required when `kind` is 'secondary' or 'tertiary'.
     */
    title?: React.ReactNode;
}

/**
 * Props for the Details component
 * 
 * @category Component
 */
export function DetailsProps(props: DetailsProps) {
    return props
}