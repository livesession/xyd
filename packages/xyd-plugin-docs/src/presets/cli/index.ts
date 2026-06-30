import {Settings} from "@xyd-js/core";
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
        return opencliToReferences(spec) as unknown as Reference[]
    }
}
