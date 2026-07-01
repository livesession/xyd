import path from "node:path";

import {Settings, APIFile, APIFileAdvanced} from "@xyd-js/core";
import {loadOpencliSpec, opencliToReferences} from "@xyd-js/opencli";
import type {Reference} from "@xyd-js/uniform";

import {Preset} from "../../types"
import {UniformPreset} from "../uniform"

export interface cliPresetOptions {
    urlPrefix?: string
    root?: string
    disableFSWrite?: boolean
}

function preset(
    settings: Settings,
    options: cliPresetOptions
) {
    return CLIUniformPreset.new(settings, options)
}

export const cliPreset = preset satisfies Preset<unknown>

class CLIUniformPreset extends UniformPreset {
    private readonly cliApi: APIFile

    private constructor(
        settings: Settings,
        options: {
            disableFSWrite?: boolean
        }
    ) {
        super(
            "cli",
            settings.api?.cli || "",
            settings?.navigation?.sidebar || [],
            options.disableFSWrite
        )
        this.cliApi = settings.api?.cli || ""
        this.uniformRefResolver = this.uniformRefResolver.bind(this)
    }

    static new(
        settings: Settings,
        options: cliPresetOptions
    ) {
        return new CLIUniformPreset(settings, {
            disableFSWrite: options.disableFSWrite
        })
            .urlPrefix(options.urlPrefix || "")
            .newUniformPreset()(settings, "cli")
    }

    protected override async uniformRefResolver(filePath: string): Promise<Reference[]> {
        if (!filePath) {
            return []
        }

        const spec = await loadOpencliSpec(filePath)

        // OpencliReference is a structural subset of Reference (the OpenCLI core
        // stays free of the React-typed uniform package).
        return opencliToReferences(spec, {
            globalOptionsPerCommand: this.globalOptionsPerCommand(filePath),
        }) as unknown as Reference[]
    }

    /** Read `api.cli[x].options.globalOptionsPerCommand` for the given source. */
    private globalOptionsPerCommand(filePath: string): boolean {
        const target = path.resolve(process.cwd(), filePath)
        const entries = this.cliEntries()
        const match = entries.find((e) => e.source && path.resolve(process.cwd(), e.source) === target)
        return ((match ?? entries.find((e) => e.options))?.options?.globalOptionsPerCommand) ?? false
    }

    private cliEntries(): APIFileAdvanced[] {
        const cli = this.cliApi
        if (!cli || typeof cli === "string") return []
        const isAdvanced = (e: unknown): e is APIFileAdvanced =>
            typeof e === "object" && e != null && "source" in e
        if (Array.isArray(cli)) return cli.filter(isAdvanced)
        if (isAdvanced(cli)) return [cli]
        return Object.values(cli).filter(isAdvanced)
    }
}
