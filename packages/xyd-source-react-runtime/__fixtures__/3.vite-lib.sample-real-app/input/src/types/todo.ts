export type Priority = "low" | "medium" | "high" | "urgent";

export type FilterStatus = "all" | "active" | "completed";

export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: Priority;
    tags: string[];
    createdAt: string;
    completedAt?: string;
    dueDate?: string;
}

export interface TodoStats {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    byPriority: Record<Priority, number>;
}
