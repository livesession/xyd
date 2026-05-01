/**
 * A single row of data in the grid
 */
export interface RowData {
    /** Unique row identifier */
    id: string;
    /** Row field values */
    [key: string]: unknown;
}

/**
 * Column sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort configuration
 */
export interface SortConfig {
    /** Column key to sort by */
    column: string;
    /** Sort direction */
    direction: SortDirection;
}

/**
 * Selection state
 */
export interface SelectionState {
    /** Set of selected row IDs */
    selectedIds: string[];
    /** Whether all rows are selected */
    allSelected: boolean;
}

/**
 * Cell edit event
 */
export interface CellEditEvent {
    /** Row being edited */
    rowId: string;
    /** Column being edited */
    column: string;
    /** Previous cell value */
    previousValue: unknown;
    /** New cell value */
    newValue: unknown;
}

/**
 * Props for the DataGrid component.
 *
 * Demonstrates function/callback props in a React component,
 * from simple event handlers to complex async operations.
 */
export interface DataGridProps {
    /** Grid data rows */
    rows: RowData[];

    // ---- Simple callbacks (no args) ----

    /** Called when the grid finishes rendering */
    onReady?: () => void;

    /** Called when the grid is unmounted */
    onDestroy?: () => void;

    // ---- Primitive argument callbacks ----

    /** Called when search input changes */
    onSearch?: (query: string) => void;

    /** Called when page number changes */
    onPageChange?: (page: number) => void;

    /** Called when "select all" checkbox is toggled */
    onSelectAll?: (selected: boolean) => void;

    // ---- Object argument callbacks ----

    /** Called when a row is clicked */
    onRowClick?: (row: RowData) => void;

    /** Called when sort configuration changes */
    onSort?: (sort: SortConfig) => void;

    /** Called when selection state changes */
    onSelectionChange?: (selection: SelectionState) => void;

    /** Called when a cell is edited */
    onCellEdit?: (event: CellEditEvent) => void;

    // ---- Multi-argument callbacks ----

    /** Called when a row is dropped during drag-and-drop reorder */
    onRowReorder?: (fromIndex: number, toIndex: number) => void;

    /** Called on cell double-click with row and column context */
    onCellDoubleClick?: (row: RowData, column: string, value: unknown) => void;

    // ---- Callbacks with return values ----

    /** Custom cell renderer, returns string representation */
    formatCell?: (value: unknown, column: string) => string;

    /** Row class name resolver */
    rowClassName?: (row: RowData, index: number) => string;

    /** Validates a cell edit, returns error message or null to accept */
    validateEdit?: (event: CellEditEvent) => string | null;

    /** Async data loader for server-side pagination */
    loadData?: (page: number, pageSize: number, sort?: SortConfig) => Promise<{ rows: RowData[]; total: number }>;

    // ---- Complex patterns ----

    /** Custom comparator for sorting */
    sortComparator?: (a: RowData, b: RowData, column: string) => number;

    /** Predicate to determine if a row is selectable */
    isRowSelectable?: (row: RowData) => boolean;

    /** Row filter predicate */
    filterRow?: (row: RowData, query: string) => boolean;

    /** Provides an unsubscribe function for external data updates */
    onSubscribe?: (unsubscribe: () => void) => void;

    /** Error handler with retry context */
    onError?: (error: Error, context?: { operation: string; retryCount: number }) => void;

    /** Transform row data before display */
    transformRow?: (row: RowData) => RowData;
}

/**
 * A data grid component with rich callback support for sorting,
 * filtering, pagination, cell editing, and row selection.
 *
 * @category Component
 */
export function DataGrid(props: DataGridProps) {
    return <div>{props.rows.length} rows</div>;
}