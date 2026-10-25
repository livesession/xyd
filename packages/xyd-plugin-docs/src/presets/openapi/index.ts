import {APIFile, Settings} from "@xyd-js/core";
import {resolveApiFileOptions} from "@xyd-js/content";
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
    private readonly openapiApi: APIFile | undefined

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
        this.openapiApi = settings.api?.openapi
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

        // `api.openapi[..].options.objectsGroup` / `.objectsLayout` /
        // `.operationPaths` — the object pages' group name and layout, and how a
        // page without an `x-docs.path` gets its path.
        const apiOptions = resolveApiFileOptions(this.openapiApi, filePath)
        const objectsGroup = apiOptions?.objectsGroup
        const objectsLayout = apiOptions?.objectsLayout
        const operationPaths = apiOptions?.operationPaths

        return oapSchemaToReferences(schema, objectsGroup || objectsLayout || operationPaths ? {
            ...(objectsGroup ? { objectsGroup } : {}),
            ...(objectsLayout ? { objectsLayout } : {}),
            ...(operationPaths ? { operationPaths } : {}),
        } : undefined)
    }
}

