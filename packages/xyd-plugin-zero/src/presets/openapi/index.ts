import {Settings} from "@xyd/core";
import {deferencedOpenAPI, oapSchemaToReferences} from "@xyd/openapi";

import {Preset} from "../../types"
import {uniformPreset} from "../uniform"

export interface openapiPresetOptions {
    urlPrefix?: string
    root?: string
}

function preset(
    settings: Settings,
    options: openapiPresetOptions
) {
    return uniformPreset(
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

export const openapiPreset = preset satisfies Preset<unknown>

