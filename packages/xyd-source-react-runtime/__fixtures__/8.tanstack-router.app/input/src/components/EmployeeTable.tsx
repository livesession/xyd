import { Link } from "@tanstack/react-router";
import type { Employee, SearchFilters } from "../types/employee";

interface EmployeeTableProps {
    employees: Employee[];
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
}

export function EmployeeTable({ employees, filters, onFiltersChange }: EmployeeTableProps) {
    const filtered = employees.filter(e => {
        if (filters.activeOnly && !e.isActive) return false;
        if (filters.department && e.department !== filters.department) return false;
        if (filters.query && !e.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
        return true;
    });

    return (
        <div>
            <input
                value={filters.query}
                onChange={e => onFiltersChange({ ...filters, query: e.target.value })}
                placeholder="Search..."
            />
            <table>
                <thead>
                    <tr><th>Name</th><th>Department</th><th>Salary</th></tr>
                </thead>
                <tbody>
                    {filtered.map(emp => (
                        <tr key={emp.id}>
                            <td>
                                <Link to="/employees/$employeeId" params={{ employeeId: String(emp.id) }}>
                                    {emp.name}
                                </Link>
                            </td>
                            <td>{emp.department}</td>
                            <td>${emp.salary.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
