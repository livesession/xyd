export type Priority = "low" | "medium" | "high" | "urgent";

export type FilterStatus = "all" | "active" | "completed";

export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: Priority;
    tags: string[];
    createdAt: Date;
    completedAt?: Date;
    dueDate?: Date;
}

export interface TodoStats {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    byPriority: Record<Priority, number>;
}
