import React from "react"

import cn from "./Table.styles";

/**
 * Props for the Table component
 */
export interface TableProps {
    /** The content to be rendered inside the table */
    children: React.ReactNode;

    /** Optional kind of the table, can be used for styling purposes */
    kind?: "secondary"

    /** Optional CSS class name to be applied to the table */
    className?: string;
}

/**
 * A table component that provides a structured way to display tabular data.
 * It supports custom styling through className prop and can contain various table elements.
 * 
 * @category Component
 */
export function Table({ children, kind, className }: TableProps) {
    return (
        <table data-kind={kind || undefined} className={`${cn.Host} ${className || ''}`}>
            {children}
        </table>
    );
}

/**
 * Props for the TableHead component
 */
export interface TableHeadProps {
    /** The content to be rendered inside the table header */
    children: React.ReactNode;
}

/**
 * Represents the header section of a table.
 * Use this component to group header content at the top of the table.
 */
Table.Head = function TableHead({ children }: TableHeadProps) {
    return <thead className={cn.Thead}>
        {children}
    </thead>
}

/**
 * Props for the TableTh component
 */
export interface TableThProps {
    /** The content to be rendered inside the table header cell */
    children: React.ReactNode;
    
    /** Whether the cell content should be right-aligned (for numeric values) */
    numeric?: boolean;
}

/**
 * Represents a header cell in the table.
 * Use this component for column headers in the table.
 */
Table.Th = function TableTh({ children, numeric }: TableThProps) {
    return <th className={`${cn.Th} ${numeric ? 'numeric' : ''}`}>
        {children}
    </th>
}

/**
 * Props for the TableTr component
 */
export interface TableTrProps {
    /** The content to be rendered inside the table row */
    children: React.ReactNode;
}

/**
 * Represents a row in the table.
 * Use this component to create rows in the table body or header.
 */
Table.Tr = function TableTr({ children }: TableTrProps) {
    return <tr className={cn.Tr}>
        {children}
    </tr>
}

/**
 * Props for the TableBody component
 */
export interface TableBodyProps {
    /** The content to be rendered inside the table body */
    children: React.ReactNode;
}

/**
 * Represents the main content area of the table.
 * Use this component to group the main content rows of the table.
 */
Table.Body = function TableBody({ children }: TableBodyProps) {
    return <tbody className={cn.Tbody}>
        {children}
    </tbody>
}

/**
 * Props for the TableTd component
 */
export interface TableTdProps {
    /** The content to be rendered inside the table cell */
    children: React.ReactNode;

    /** Whether the cell content should be right-aligned (for numeric values) */
    numeric?: boolean;
    
    /** Whether the cell should have a muted appearance */
    muted?: boolean;
}

/**
 * Represents a data cell in the table.
 * Use this component for regular data cells in the table body.
 */
Table.Td = function TableTd({ children, numeric, muted }: TableTdProps) {
    return <td className={`${cn.Td} ${numeric ? 'numeric' : ''} ${muted ? 'muted' : ''}`}>
        {children}
    </td>
}

/**
 * Props for the TableCell component
 */
export interface TableCellProps {
    /** The content to be rendered inside the table cell */
    children: React.ReactNode;
}

/**
 * A custom table cell component that wraps content in a div with specific styling.
 * Use this component when you need a custom-styled cell with additional structure.
 */
Table.Cell = function TableCell({ children }: TableCellProps) {
    return <xyd-table-cell className={cn.Cell}>
        <div part="child">
            {children}
        </div>
    </xyd-table-cell>
}

/**
 * Props for the TableModelCell component
 */
export interface TableModelCellProps {
    /** The content to be rendered inside the model cell */
    children: React.ReactNode;
}
