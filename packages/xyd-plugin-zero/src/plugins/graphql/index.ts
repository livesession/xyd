import {Settings} from "@xyd/core";
import {gqlSchemaToReferences} from "@xyd/gql";

import {Plugin} from "../../types"
import {uniformPlugin} from "../uniform"

interface graphqlPluginOptions {
    urlPrefix?: string
    root?: string
}

function plugin(
    settings: Settings,
    options: graphqlPluginOptions
) {
    return uniformPlugin(
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

export const graphqlPlugin = plugin satisfies Plugin<unknown>

