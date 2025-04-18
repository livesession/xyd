import React from "react"

import cn from "./Table.styles";

export interface TableProps {
    children: React.ReactNode;
    className?: string;
}

export function Table({ children, className }: TableProps) {
    return (
        <table className={`${cn.Host} ${className || ''}`}>
            {children}
        </table>
    );
}

export interface TableHeadProps {
    children: React.ReactNode;
}

Table.Head = function TableHead({ children }: TableHeadProps) {
    return <thead className={cn.Thead}>
        {children}
    </thead>
}

export interface TableThProps {
    children: React.ReactNode;
    numeric?: boolean;
}

Table.Th = function TableTh({ children, numeric }: TableThProps) {
    return <th className={`${cn.Th} ${numeric ? 'numeric' : ''}`}>
        {children}
    </th>
}

export interface TableTrProps {
    children: React.ReactNode;
}

Table.Tr = function TableTr({ children }: TableTrProps) {
    return <tr className={cn.Tr}>
        {children}
    </tr>
}

export interface TableBodyProps {
    children: React.ReactNode;
}

Table.Body = function TableBody({ children }: TableBodyProps) {
    return <tbody className={cn.Tbody}>
        {children}
    </tbody>
}

export interface TableTdProps {
    children: React.ReactNode;
    numeric?: boolean;
    muted?: boolean;
}

Table.Td = function TableTd({ children, numeric, muted }: TableTdProps) {
    return <td className={`${cn.Td} ${numeric ? 'numeric' : ''} ${muted ? 'muted' : ''}`}>
        {children}
    </td>
}

export interface TableCellProps {
    children: React.ReactNode;
}

Table.Cell = function TableCell({ children }: TableCellProps) {
    return <xyd-table-cell className={cn.Cell}>
        <div part="child">
            {children}
        </div>
    </xyd-table-cell>
}

export interface TableModelCellProps {
    children: React.ReactNode;
}
