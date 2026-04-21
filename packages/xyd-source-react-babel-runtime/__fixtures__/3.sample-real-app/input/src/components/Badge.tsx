import type { Priority } from "../types/todo";

interface BadgeProps {
    /** The text label displayed inside the badge */
    label: string;
    /** Visual variant controlling color and style */
    variant: "default" | "success" | "warning" | "danger" | "info";
    /** Render as a smaller pill */
    size?: "sm" | "md";
    /** Whether the badge can be dismissed */
    dismissible?: boolean;
    /** Called when the dismiss button is clicked */
    onDismiss?: () => void;
}

const VARIANT_CLASSES: Record<BadgeProps["variant"], string> = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
    danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
};

const PRIORITY_VARIANT: Record<Priority, BadgeProps["variant"]> = {
    low: "default",
    medium: "info",
    high: "warning",
    urgent: "danger",
};

function Badge({ label, variant, size = "sm", dismissible, onDismiss }: BadgeProps) {
    const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${VARIANT_CLASSES[variant]}`}>
            {label}
            {dismissible && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10"
                    aria-label={`Remove ${label}`}
                >
                    x
                </button>
            )}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: Priority }) {
    return <Badge label={priority} variant={PRIORITY_VARIANT[priority]} />;
}

export { Badge, PriorityBadge };
export type { BadgeProps };
