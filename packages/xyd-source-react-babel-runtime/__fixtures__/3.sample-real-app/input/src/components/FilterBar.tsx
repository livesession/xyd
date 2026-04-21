import type { FilterStatus } from "../types/todo";
import { useTodos } from "../hooks/useTodos";

interface FilterBarProps {
    /** Additional CSS classes appended to the root element */
    className?: string;
}

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
];

function FilterBar({ className }: FilterBarProps) {
    const { filter, setFilter, searchQuery, setSearchQuery, stats, clearCompleted } = useTodos();

    return (
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className || ""}`}>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setFilter(tab.value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            filter === tab.value
                                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    >
                        {tab.label}
                        <span className="ml-1 text-gray-400">
                            {tab.value === "all" ? stats.total : tab.value === "active" ? stats.active : stats.completed}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {stats.completed > 0 && (
                    <button
                        type="button"
                        onClick={clearCompleted}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Clear completed
                    </button>
                )}
            </div>
        </div>
    );
}

export { FilterBar };
export type { FilterBarProps };
