import React from "react"

import {$table} from "./Table.styles";

export interface TableProps {
    children: React.ReactNode;
}

export function Table({children}: TableProps) {
    return <table className={$table.host}>
        {children}
    </table>
}

export interface TableThProps {
    children: React.ReactNode;
}

Table.Th = function TableTh({children}: TableThProps) {
    return <th className={$table.th}>
        {children}
    </th>
}

export interface TableTrProps {
    children: React.ReactNode;
}

Table.Tr = function TableTr({children}: TableTrProps) {
    return <tr className={$table.tr}>
        {children}
    </tr>

}

export interface TableTdProps {
    children: React.ReactNode;
}

Table.Td = function TableTd({children}: TableTdProps) {
    return <td className={$table.td}>
        {children}
    </td>

}