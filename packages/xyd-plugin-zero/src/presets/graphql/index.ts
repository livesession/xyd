import {Settings} from "@xyd-js/core";
import {gqlSchemaToReferences} from "@xyd-js/gql";

import {Preset} from "../../types"
import {uniformPreset} from "../uniform"

interface graphqlPluginOptions {
    urlPrefix?: string
    root?: string
}

function preset(
    settings: Settings,
    options: graphqlPluginOptions
) {
    return uniformPreset(
        "graphql",
        settings?.api?.graphql || "",
        settings?.structure?.sidebar || [],
        {
            root: options.root,
            urlPrefix: options.urlPrefix,
        },
        async (gqlPath: string) => {
            return await gqlSchemaToReferences(gqlPath)
        },
    )(settings)
}

export const graphqlPreset = preset satisfies Preset<unknown>

