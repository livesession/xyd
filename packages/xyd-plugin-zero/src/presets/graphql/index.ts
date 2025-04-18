import {Settings} from "@xyd-js/core";
import {gqlSchemaToReferences} from "@xyd-js/gql";
import type {Reference} from "@xyd-js/uniform";

import {Preset} from "../../types"
import {UniformPreset} from "../uniform"

interface graphqlPluginOptions {
    urlPrefix?: string
    root?: string
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
    ) {
        super(
            "graphql",
            settings.api?.graphql || "",
            settings?.structure?.sidebar || [],
        )
    }

    static new(
        settings: Settings,
        options: graphqlPluginOptions
    ) {
        return new GraphQLUniformPreset(settings)
            .root(options.root || "")
            .urlPrefix(options.urlPrefix || "")
            .newUniformPreset()(settings)
    }

    protected override async uniformRefResolver(filePath: string): Promise<Reference[]> {
        if (!filePath) {
            return []
        }

        return await gqlSchemaToReferences(filePath)
    }
}

