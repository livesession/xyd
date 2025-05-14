import path from "path";
import fs from "fs/promises";

import type {Reference} from "@xyd-js/uniform";
import {Settings} from "@xyd-js/core";
import {sourcesToUniform} from "@xyd-js/sources/ts"

import {Preset} from "../../types"
import {UniformPreset} from "../uniform"

export interface sourcesPresetsOptions {
    urlPrefix?: string
    root?: string
    disableFSWrite?: boolean    
}

function preset(
    settings: Settings,
    options: sourcesPresetsOptions
) {
    return SourceUniformPreset.new(settings, options)
}

export const sourcesPreset = preset satisfies Preset<unknown>

class SourceUniformPreset extends UniformPreset {
    private constructor(
        settings: Settings,
        options: {
            disableFSWrite?: boolean
        }
    ) {
        super(
            "sources",
            settings.api?.sources || "",
            settings?.navigation?.sidebar || [],
            options.disableFSWrite
        )
    }

    static new(
        settings: Settings,
        options: sourcesPresetsOptions
    ) {
        return new SourceUniformPreset(settings, {
            disableFSWrite: options.disableFSWrite
        })
            .urlPrefix(options.urlPrefix || "")
            .sourceTheme(true)
            .newUniformPreset()(settings, "sources")
    }

    // TODO: options to specify only specific packages?
    protected override async uniformRefResolver(filePath: string): Promise<Reference[]> {
        if (!filePath) {
            return []
        }

        const packages = await fs.readdir(filePath)

        const ref = await sourcesToUniform(
            filePath,
            packages.map(p => path.join(filePath, p))
        )

        return ref || []
    }
}

