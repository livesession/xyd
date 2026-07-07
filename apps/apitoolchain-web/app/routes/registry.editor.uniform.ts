import { requireUser } from "~/auth.server";
import { specTextToUniform } from "~/lib/openapi/toGroups.server";
import type { Route } from "./+types/registry.editor.uniform";

/**
 * Resource route for the editor's live preview: POST the current Monaco spec
 * text, get back `{ references, groups, error }` (the same server-only xyd
 * conversion the editor loader runs). Called debounced as the user types.
 */
export async function action({ request }: Route.ActionArgs) {
  await requireUser();
  const form = await request.formData();
  const text = String(form.get("spec") ?? "");
  return specTextToUniform(text);
}
