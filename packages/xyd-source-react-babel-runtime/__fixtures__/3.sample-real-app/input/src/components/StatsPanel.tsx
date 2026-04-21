import type { TodoStats } from "../types/todo";
import { useTodos } from "../hooks/useTodos";

interface StatCardProps {
    /** Stat label displayed above the value */
    label: string;
    /** Numeric value to display */
    value: number;
    /** Color accent for the value */
    color?: string;
}

function StatCard({ label, value, color }: StatCardProps) {
    return (
        <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
            <span className={`text-2xl font-bold ${color || "text-gray-900 dark:text-white"}`}>{value}</span>
        </div>
    );
}

interface StatsPanelProps {
    /** Override the stats instead of reading from context */
    stats?: TodoStats;
    /** Render in compact mode (horizontal) */
    compact?: boolean;
}

function StatsPanel({ stats: propStats, compact }: StatsPanelProps) {
    const { stats: contextStats } = useTodos();
    const stats = propStats || contextStats;

    const cards = [
        { label: "Total", value: stats.total },
        { label: "Active", value: stats.active, color: "text-blue-500" },
        { label: "Done", value: stats.completed, color: "text-green-500" },
        { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "text-red-500" : undefined },
    ];

    return (
        <div className={compact ? "flex gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
            {cards.map((c) => (
                <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />
            ))}
        </div>
    );
}

export { StatsPanel, StatCard };
export type { StatsPanelProps, StatCardProps };
