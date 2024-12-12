import React from "react"

import {$table, $th, $tr, $td} from "./Table.styles";

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
    return <th className={$th.host}>
        {children}
    </th>
}

export interface TableTrProps {
    children: React.ReactNode;
}

Table.Tr = function TableTr({children}: TableTrProps) {
    return <tr className={$tr.host}>
        {children}
    </tr>

}

export interface TableTdProps {
    children: React.ReactNode;
}

Table.Td = function TableTd({children}: TableTdProps) {
    return <td className={$td.host}>
        {children}
    </td>

}