interface BadgeProps {
    /** Visual style variant */
    variant: "default" | "success" | "warning" | "error";
    /** Size of the badge */
    size?: "sm" | "md" | "lg";
    /** Label text */
    label: string;
}

export function Badge({ variant, size = "md", label }: BadgeProps) {
    return (
        <span data-variant={variant} data-size={size}>
            {label}
        </span>
    );
}