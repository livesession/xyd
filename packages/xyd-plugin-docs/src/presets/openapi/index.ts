import {APIFile, Settings, Sidebar} from "@xyd-js/core";
import {resolveApiFileOptions} from "@xyd-js/content";
import {deferencedOpenAPI, oapSchemaToReferences, getXDocs, collapseObjectsGroup, groupByTagGroups} from "@xyd-js/openapi";
import type {NavigationGroupEntry} from "@xyd-js/openapi";
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

    /** The dereferenced document per source, for the navigation's finishing
     *  pass (its `x-docs.sidebar` probe) — filled by the ref resolver. */
    private readonly schemas = new Map<string, Parameters<typeof collapseObjectsGroup>[1]>()

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
            this.schemas.set(filePath, schema)
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

    /**
     * The JS path's twin of the fused native passes, in the same order:
     * 1. the top-level objects group flagged `collapsed: true`
     *    (`api.openapi[..].options.objectsCollapsed`, default `true`), so the
     *    sidebar folds it behind a toggle on its header — it finds that group
     *    by its raw name, so it runs first;
     * 2. the document's tag groups (`x-tagGroups`) as sections over the
     *    top-level groups, and its tags' display names (`x-displayName`) as
     *    the groups' labels — driven by the document alone, no option.
     */
    protected override navigationFinish(
        sidebar: Sidebar[],
        references: Reference[],
        urlPrefix: string,
        filePath: string,
    ): Sidebar[] {
        const apiOptions = resolveApiFileOptions(this.openapiApi, filePath)
        const schema = this.schemas.get(filePath)
        // Sidebar and NavigationGroupEntry are the same generated shape; the
        // entry type's index signature is what the interface cannot state.
        const collapsed = collapseObjectsGroup(
            sidebar as unknown as NavigationGroupEntry[],
            schema,
            references,
            urlPrefix,
            {
                ...(apiOptions?.objectsGroup ? { objectsGroup: apiOptions.objectsGroup } : {}),
                ...(apiOptions?.objectsLayout ? { objectsLayout: apiOptions.objectsLayout } : {}),
                ...(typeof apiOptions?.objectsCollapsed === "boolean" ? { objectsCollapsed: apiOptions.objectsCollapsed } : {}),
            },
        )
        return groupByTagGroups(collapsed, schema) as unknown as Sidebar[]
    }
}

