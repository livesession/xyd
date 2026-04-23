export interface Employee {
    id: number;
    name: string;
    department: "engineering" | "design" | "marketing" | "sales";
    salary: number;
    isActive: boolean;
}

export interface SearchFilters {
    query: string;
    department?: Employee["department"];
    activeOnly: boolean;
}
