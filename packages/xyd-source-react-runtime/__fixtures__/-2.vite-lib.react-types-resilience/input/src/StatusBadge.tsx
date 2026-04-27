interface StatusBadgeProps {
    /** Current status label */
    label: string;

    /** Visual variant */
    variant: "success" | "warning" | "error" | "info";

    /** Size of the badge */
    size?: "small" | "medium" | "large";

    /** Whether the badge should pulse */
    animated?: boolean;
}

export function StatusBadge({ label, variant, size = "medium", animated }: StatusBadgeProps) {
    return (
        <span className={`badge badge-${variant} badge-${size} ${animated ? "pulse" : ""}`}>
            {label}
        </span>
    );
}
