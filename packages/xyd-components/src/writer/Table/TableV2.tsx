import React from "react"

import cn from "./TableV2.styles";

export interface TableV2Props {
    children: React.ReactNode;
    className?: string;
}

export function TableV2({children, className}: TableV2Props) {
    return (
        <div className={cn.Host}>
            <table className={`${cn.Table} ${className || ''}`}>
                {children}
            </table>
        </div>
    );
}

export interface TableHeadProps {
    children: React.ReactNode;
}

TableV2.Head = function TableHead({children}: TableHeadProps) {
    return <thead className={cn.Thead}>
        {children}
    </thead>
}

export interface TableThProps {
    children: React.ReactNode;
    numeric?: boolean;
}

TableV2.Th = function TableTh({children, numeric}: TableThProps) {
    return <th className={`${cn.Th} ${numeric ? 'numeric' : ''}`}>
        {children}
    </th>
}

export interface TableTrProps {
    children: React.ReactNode;
}

TableV2.Tr = function TableTr({children}: TableTrProps) {
    return <tr className={cn.Tr}>
        {children}
    </tr>
}

export interface TableTdProps {
    children: React.ReactNode;
    numeric?: boolean;
    muted?: boolean;
}

TableV2.Td = function TableTd({children, numeric, muted}: TableTdProps) {
    return <td className={`${cn.Td} ${numeric ? 'numeric' : ''} ${muted ? 'muted' : ''}`}>
        {children}
    </td>
}

export interface TableCellProps {
    children: React.ReactNode;
}

TableV2.Cell = function TableCell({children}: TableCellProps) {
    return <div className={cn.Cell}>
        <div className={cn.CellContent}>
            {children}
        </div>
    </div>
}

export interface TableModelCellProps {
    children: React.ReactNode;
}

TableV2.ModelCell = function TableModelCell({children}: TableModelCellProps) {
    return <div className={cn.ModelCell}>
        {children}
    </div>
} 