import type { Route } from "./+types/home";

import { PageIndex } from "../pages/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "xyd: Open Source Framework for Ambitious Docs" },
    {
      name: "description",
      content:
        "Powerful open source framework to build beautiful docs. Simple config, zero hassle. Zero learning curve. Built-in themes, OpenAPI/GraphQL, plugins, and components support.",
    },
  ];
}

export default function Home() {
  return <PageIndex />;
}
