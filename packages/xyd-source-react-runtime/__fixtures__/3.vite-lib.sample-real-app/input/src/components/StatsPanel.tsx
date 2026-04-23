import type { TodoStats } from "../types/todo";

interface StatCardProps {
    /** Stat label displayed above the value */
    label: string;
    /** Numeric value to display */
    value: number;
    /** Color accent for the value */
    color?: string;
}

interface StatsPanelProps {
    /** Todo statistics to display */
    stats: TodoStats;
    /** Render in compact horizontal mode */
    compact?: boolean;
}

function StatCard({ label, value, color }: StatCardProps) {
    return (
        <div className="stat-card">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={{ color }}>{value}</span>
        </div>
    );
}

export function StatsPanel({ stats, compact }: StatsPanelProps) {
    const cards = [
        { label: "Total", value: stats.total },
        { label: "Active", value: stats.active, color: "#3b82f6" },
        { label: "Done", value: stats.completed, color: "#22c55e" },
        { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "#ef4444" : undefined },
    ];

    return (
        <div className={`stats-panel ${compact ? "compact" : ""}`}>
            {cards.map((c) => (
                <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />
            ))}
        </div>
    );
}

