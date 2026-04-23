import type { FilterStatus, TodoStats } from "../types/todo";

interface FilterBarProps {
    /** Current active filter */
    filter: FilterStatus;

    /** Called when the filter changes */
    onFilterChange: (filter: FilterStatus) => void;

    /** Current search query */
    searchQuery: string;

    /** Called when the search query changes */
    onSearchChange: (query: string) => void;

    /** Todo statistics for displaying counts */
    stats: TodoStats;

    /** Called when "Clear completed" is clicked */
    onClearCompleted: () => void;

    /** Additional CSS classes */
    className?: string;
}

export function FilterBar({ filter, onFilterChange, searchQuery, onSearchChange, stats, onClearCompleted, className }: FilterBarProps) {
    const tabs: { value: FilterStatus; label: string }[] = [
        { value: "all", label: `All (${stats.total})` },
        { value: "active", label: `Active (${stats.active})` },
        { value: "completed", label: `Done (${stats.completed})` },
    ];

    return (
        <div className={`filter-bar ${className || ""}`}>
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        className={filter === tab.value ? "active" : ""}
                        onClick={() => onFilterChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <input type="search" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..." />
            {stats.completed > 0 && (
                <button type="button" onClick={onClearCompleted} className="clear-btn">
                    Clear completed
                </button>
            )}
        </div>
    );
}

