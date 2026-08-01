import { RegistryListPage } from "~/components/RegistryListPage";
import { listApis } from "~/data";
import type { Route } from "./+types/registry.schemas";

export function meta() {
  return [{ title: "Schemas — apitoolchain" }];
}

export async function loader(_: Route.LoaderArgs) {
  const all = await listApis();
  return { all };
}

export default function RegistrySchemasRoute({
  loaderData,
}: Route.ComponentProps) {
  const { all } = loaderData;
  return <RegistryListPage kind="schema" all={all} />;
}
