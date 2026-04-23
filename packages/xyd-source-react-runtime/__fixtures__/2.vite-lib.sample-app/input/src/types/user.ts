export type Role = "admin" | "editor" | "viewer";

export interface Address {
    street: string;
    city: string;
    country: string;
    zip?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    address: Address;
    tags: string[];
    joinedAt: string;
}
