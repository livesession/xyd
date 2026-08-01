import {
  createProject,
  deleteProject,
  renameProject,
  selectProject,
} from "~/data";
import type { Route } from "./+types/projects";

/**
 * Resource route (no UI) — the sidebar switcher + project settings submit here.
 * A successful mutation revalidates the app-layout loader, refreshing the
 * current context (and project-scoped lists) everywhere.
 */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  switch (intent) {
    case "select":
      return selectProject(String(form.get("projectId") ?? ""));
    case "create":
      return createProject(String(form.get("name") ?? ""));
    case "rename":
      return renameProject(
        String(form.get("id") ?? ""),
        String(form.get("name") ?? ""),
      );
    case "delete":
      return deleteProject(String(form.get("id") ?? ""));
    default:
      return { ok: false, message: "unknown intent" };
  }
}
