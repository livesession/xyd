import { remarkDefinitionList, defListHastHandlers } from "remark-definition-list";

import type { Plugin, PluginComponents, PluginConfig } from "@xyd-js/plugins";

import styles from "./styles/index.css";

import { components } from "./components";

export type {
  NavItem as XSpecNavItemType,
  ProductionItem as XSpecProductionItem,
  SpecBoxProps as XSpecBoxProps,
  SpecHeaderProps as XSpecHeaderProps,
  SpecSectionProps as XSpecSectionProps,
} from "./types";

export default function XspecPlugin(): Plugin {
  return () => {
    const head: [string, Record<string, any>, string?][] = [
      ["style", {}, styles],
    ];
    // Align with the host's unified types; the plugin dependency ships its own copy.
    const remarkPlugins =
      [remarkDefinitionList] as unknown as NonNullable<
        PluginConfig["markdown"]
      >["remark"];

    return {
      name: "plugin-xspec",
      vite: [],
      head,
      components,
      markdown: {
        remark: remarkPlugins,
        remarkRehypeHandlers: {
          ...defListHastHandlers,
        }
      },
      hooks: {
        // TODO: hooks should not override entire SYSTEM IT SHOULD ONLY EXCLUDE COMPONENTS FOR THIS !!! PLUGIN !!!
        applyComponents(cfg) {
          const component = cfg?.metadata?.component as string

          if (component === "xspec") {
            return true;
          }

          return false;
        },
      },
    };
  };
}
