// Dispatcher (S6+ W3): the group-tree/sidebar core runs in Rust
// (crates/xyd_uniform::plugins::plugin_navigation) when the native core is
// present. Only the `engine.uniform.store` flag from settings is forwarded —
// live Settings objects can carry non-serializable values (docs.tsx), and the
// Rust core reads nothing else.
import type { Settings, Sidebar, MetadataMap } from "@xyd-js/core";

import type { UniformPluginArgs, UniformPlugin } from "../index";
import type { Reference } from "../types";
import { native } from "../native";
import {
    pluginNavigation as jsPluginNavigation,
    type pluginNavigationOptions,
} from "../impl-js/pluginNavigation";

export type { pluginNavigationOptions } from "../impl-js/pluginNavigation";

type pluginNavigationOutput = {
    pageFrontMatter: MetadataMap;
    sidebar: Sidebar[];
};

export function pluginNavigation(
    settings: Settings,
    options: pluginNavigationOptions
): UniformPlugin<pluginNavigationOutput> {
    if (!native?.pluginNavigation) {
        return jsPluginNavigation(settings, options);
    }

    return function pluginNavigationInner({ references, defer }: UniformPluginArgs) {
        defer(() =>
            JSON.parse(
                native.pluginNavigation(
                    JSON.stringify({
                        settings: {
                            engine: {
                                uniform: {
                                    store: !!settings?.engine?.uniform?.store,
                                },
                            },
                        },
                        urlPrefix: options.urlPrefix,
                        references: Array.isArray(references) ? references : [references],
                    })
                )
            )
        );

        return (_ref: Reference) => {};
    };
}
