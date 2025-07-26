import {Settings} from "@xyd-js/core";
import {deferencedOpenAPI, oapSchemaToReferences, getXDocs} from "@xyd-js/openapi";
import type {Reference} from "@xyd-js/uniform";

import {Preset} from "../../types"
import {UniformPreset} from "../uniform"

export interface openapiPresetOptions {
    urlPrefix?: string
    root?: string
    disableFSWrite?: boolean
}

function preset(
    settings: Settings,
    options: openapiPresetOptions
) {
    return OpenAPIUniformPreset.new(settings, options)
}

export const openapiPreset = preset satisfies Preset<unknown>

class OpenAPIUniformPreset extends UniformPreset {
    private constructor(
        settings: Settings,
        options: {
            disableFSWrite?: boolean
        }
    ) {
        super(
            "openapi",
            settings.api?.openapi || "",
            settings?.navigation?.sidebar || [],
            options.disableFSWrite
        )
        this.uniformRefResolver = this.uniformRefResolver.bind(this)
    }

    static new(
        settings: Settings,
        options: openapiPresetOptions
    ) {
        return new OpenAPIUniformPreset(settings, {
            disableFSWrite: options.disableFSWrite
        })
            .urlPrefix(options.urlPrefix || "")
            .newUniformPreset()(settings, "openapi")
    }

    protected override async uniformRefResolver(filePath: string): Promise<Reference[]> {
        if (!filePath) {
            return []
        }

        const schema = await deferencedOpenAPI(filePath)
        if (schema) {
            const xdocs = getXDocs(schema)
            if (xdocs?.route) {
                this.fileRouting(filePath, xdocs.route)
            }
        }

        return oapSchemaToReferences(schema)
    }
}

