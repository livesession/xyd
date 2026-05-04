/**
 * Status of a request
 */
export type RequestStatus = "pending" | "loading" | "success" | "error";

/**
 * User object
 */
export interface User {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Email address */
    email: string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
    /** Current page number */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Items per page */
    perPage: number;
}

/**
 * Filter criteria for querying data
 */
export interface FilterCriteria {
    /** Field name to filter on */
    field: string;
    /** Comparison operator */
    operator: "eq" | "neq" | "gt" | "lt" | "contains";
    /** Value to compare against */
    value: string | number | boolean;
}

/**
 * Result of an async operation
 */
export interface AsyncResult<T> {
    /** The data returned */
    data: T;
    /** Error message if failed */
    error?: string;
    /** HTTP status code */
    statusCode: number;
}

/**
 * Configuration for an event system with various callback patterns.
 *
 * Demonstrates how uniform handles functions as properties,
 * from simple no-arg callbacks to complex generic signatures.
 */
export interface EventSystemConfig {
    // ---- Simple callbacks ----

    /** Called when the system initializes (no arguments) */
    onInit: () => void;

    /** Called when the system is destroyed, returns cleanup success */
    onDestroy: () => boolean;

    /** Optional callback when system is ready */
    onReady?: () => void;

    // ---- Primitive argument callbacks ----

    /** Called when a text value changes */
    onTextChange: (value: string) => void;

    /** Called on numeric input with min/max boundaries */
    onRangeChange: (value: number, min: number, max: number) => void;

    /** Called when a toggle state changes */
    onToggle: (enabled: boolean) => void;

    /** Called on status transition */
    onStatusChange: (previous: RequestStatus, current: RequestStatus) => void;

    // ---- Object argument callbacks ----

    /** Called when a user is selected */
    onUserSelect: (user: User) => void;

    /** Called when pagination changes */
    onPageChange: (pagination: PaginationInfo) => void;

    /** Called when multiple filters are applied */
    onFilter: (filters: FilterCriteria[]) => void;

    // ---- Callbacks with return values ----

    /** Validates input, returns error message or null */
    validate: (input: string) => string | null;

    /** Transforms data before saving */
    transform: (data: Record<string, unknown>) => Record<string, unknown>;

    /** Async data fetcher */
    fetchData: (url: string, options?: { timeout?: number }) => Promise<AsyncResult<unknown>>;

    // ---- Complex / advanced patterns ----

    /** Comparator for custom sorting */
    comparator: (a: User, b: User) => number;

    /** Reducer-style callback */
    reducer: (state: Record<string, unknown>, action: { type: string; payload?: unknown }) => Record<string, unknown>;

    /** Event handler with optional prevent-default */
    onEvent: (eventName: string, data: unknown, preventDefault?: () => void) => void;

    /** Callback that receives another callback (nested function) */
    onSubscribe: (unsubscribe: () => void) => void;

    /** Iterator/visitor pattern */
    forEach: (item: User, index: number, array: User[]) => void;

    /** Optional error handler */
    onError?: (error: Error, context?: { retryCount: number; timestamp: number }) => void;

    /** Predicate function */
    filter: (item: User) => boolean;

    /** Map/projection function */
    mapUser: (user: User) => { label: string; value: string };
}