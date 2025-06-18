import { Settings } from "@xyd-js/core";
import { gqlSchemaToReferences } from "@xyd-js/gql";
import type { Reference } from "@xyd-js/uniform";

import { Preset } from "../../types"
import { UniformPreset } from "../uniform"

interface graphqlPluginOptions {
    urlPrefix?: string
    root?: string
    disableFSWrite?: boolean
}

function preset(
    settings: Settings,
    options: graphqlPluginOptions
) {
    return GraphQLUniformPreset.new(settings, options)
}

export const graphqlPreset = preset satisfies Preset<unknown>

class GraphQLUniformPreset extends UniformPreset {
    private constructor(
        settings: Settings,
        options: {
            disableFSWrite?: boolean
        }
    ) {
        super(
            "graphql",
            settings.api?.graphql || "",
            settings?.navigation?.sidebar || [],
            options.disableFSWrite
        )

        this.uniformRefResolver = this.uniformRefResolver.bind(this)
    }

    static new(
        settings: Settings,
        options: graphqlPluginOptions
    ) {
        return new GraphQLUniformPreset(settings, {
            disableFSWrite: options.disableFSWrite
        })
            .urlPrefix(options.urlPrefix || "")
            .newUniformPreset()(settings, "graphql")
    }

    protected override async uniformRefResolver(filePath: string): Promise<Reference[]> {
        if (!filePath) {
            return []
        }

        const resp = await gqlSchemaToReferences(filePath)

        if ("__UNSAFE_route" in resp && typeof resp.__UNSAFE_route === "function") {
            // If the route is a function, we need to call it to get the actual route
            const route = resp.__UNSAFE_route();
            if (route) {
                this.fileRouting(filePath, route);
            }
        }

        return resp
    }
}

