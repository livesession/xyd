import {Settings} from "@xyd/core";
import {deferencedOpenAPI, oapSchemaToReferences} from "@xyd/openapi";

import {Plugin} from "../../types"
import {uniformPlugin} from "../uniform"

interface openapiPluginOptions {
    urlPrefix?: string
    root?: string
}

function plugin(
    settings: Settings,
    options: openapiPluginOptions
) {
    return uniformPlugin(
        "openapi",
        settings?.api?.openapi || "",
        settings?.structure?.sidebar || [],
        {
            root: options.root,
            urlPrefix: options.urlPrefix,
        },
        async (openApiPath: string) => {
            const schema = await deferencedOpenAPI(openApiPath)

            return oapSchemaToReferences(schema)
        },
    )(settings)
}

export const openapiPlugin = plugin satisfies Plugin<unknown>

