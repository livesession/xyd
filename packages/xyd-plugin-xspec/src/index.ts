import type { Plugin, PluginComponents } from "@xyd-js/plugins";

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

    return {
      name: "plugin-xspec",
      vite: [],
      head,
      components,
      hooks: { // TODO: hooks should not override entire SYSTEM IT SHOULD ONLY EXCLUDE COMPONENTS FOR THIS !!! PLUGIN !!! 
        applyComponents(cfg) {
          if (cfg?.metadata?.component === "xspec") {
            return true;
          }

          return false;
        },
      },
    };
  };
}