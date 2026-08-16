// Dispatcher (S6+ W3): the view-building core runs in Rust
// (crates/xyd_uniform::plugins::plugin_json_view) when the native core is
// present. The UniformPlugin closure contract stays JS — the factory defers
// one native call over the full Reference[].
import type { UniformPluginArgs, UniformPlugin } from "../index";
import type { Reference } from "../types";
import { native } from "../native";
import { pluginJsonView as jsPluginJsonView } from "../impl-js/pluginJsonView";

export interface pluginJsonViewOptions {
}

type pluginJsonViewOutput = {
    jsonViews: string;
};

export function pluginJsonView(
    options?: pluginJsonViewOptions
): UniformPlugin<pluginJsonViewOutput> {
    if (!native?.pluginJsonView) {
        return jsPluginJsonView(options);
    }

    return function pluginJsonViewInner({ references, defer }: UniformPluginArgs) {
        defer(() => ({
            jsonViews: JSON.parse(
                native.pluginJsonView(
                    JSON.stringify(Array.isArray(references) ? references : [references])
                )
            ),
        }));

        return (_ref: Reference) => {};
    };
}
