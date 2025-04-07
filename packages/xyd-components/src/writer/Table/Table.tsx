import React from "react"

import * as cn from "./Table.styles";

export interface TableProps {
    children: React.ReactNode;
}

export function Table({children}: TableProps) {
    return <table className={cn.TableHost}>
        {children}
    </table>
}

export interface TableThProps {
    children: React.ReactNode;
}

Table.Th = function TableTh({children}: TableThProps) {
    return <th className={cn.TableTh}>
        {children}
    </th>
}

export interface TableTrProps {
    children: React.ReactNode;
}

Table.Tr = function TableTr({children}: TableTrProps) {
    return <tr className={cn.TableTr}>
        {children}
    </tr>

}

export interface TableTdProps {
    children: React.ReactNode;
}

Table.Td = function TableTd({children}: TableTdProps) {
    return <td className={cn.TableTd}>
        {children}
    </td>

}