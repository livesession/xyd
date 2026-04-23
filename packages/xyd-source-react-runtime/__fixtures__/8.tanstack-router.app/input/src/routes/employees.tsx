import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmployeeTable } from "../components/EmployeeTable";
import type { Employee, SearchFilters } from "../types/employee";

const EMPLOYEES: Employee[] = [
    { id: 1, name: "Alice", department: "engineering", salary: 120000, isActive: true },
    { id: 2, name: "Bob", department: "design", salary: 95000, isActive: true },
    { id: 3, name: "Carol", department: "marketing", salary: 85000, isActive: false },
];

export const Route = createFileRoute("/employees")({
    component: function Employees() {
        const [filters, setFilters] = useState<SearchFilters>({ query: "", activeOnly: false });

        return (
            <div>
                <h1>Employees</h1>
                <EmployeeTable employees={EMPLOYEES} filters={filters} onFiltersChange={setFilters} />
            </div>
        );
    },
});
