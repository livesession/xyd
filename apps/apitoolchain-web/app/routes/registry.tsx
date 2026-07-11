import { RegistryListPage } from "~/components/RegistryListPage";
import { listApis, type RegisterApiInput, registerApi } from "~/data";
import type { Route } from "./+types/registry";

export function meta() {
  return [
    { title: "Registry — apitoolchain" },
    { name: "description", content: "Registered API specs and schemas" },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  const all = await listApis();
  return { all };
}

export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const name = str("name");
  if (!name) return { ok: false as const, message: "Name is required." };
  const input: RegisterApiInput = {
    name,
    id: str("id") || undefined,
    ns: str("ns") || undefined,
    kind: str("kind") === "schema" ? "schema" : "api",
    format: (str("format") || undefined) as RegisterApiInput["format"],
    specText: String(form.get("specText") ?? "") || undefined,
    url: str("url") || undefined,
  };
  return registerApi(input);
}

export default function RegistryRoute({ loaderData }: Route.ComponentProps) {
  const { all } = loaderData;
  return <RegistryListPage kind="api" all={all} />;
}
