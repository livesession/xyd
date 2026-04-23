import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: () => <div><h1>Dashboard</h1></div>,
});
