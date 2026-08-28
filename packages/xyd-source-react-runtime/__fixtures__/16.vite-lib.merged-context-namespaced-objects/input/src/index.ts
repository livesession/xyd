// @ts-nocheck
// Reproduces: namespaced object types (composer.VFS, composer.BootVolume)
// resolved as {type: "object", properties: [...]} but should preserve the
// original type name: {type: "VFS", properties: [...]}.

import { createContext, useContext } from "react";

namespace composer {
    export interface VFS {
        readFile: (path: string) => string;
        writeFile: (path: string, content: string) => void;
        listFiles: (dir: string) => string[];
    }

    export interface BootVolume {
        path: string;
        sizeBytes: number;
        mounted: boolean;
    }

    export interface FileSystemContext {
        vfs: VFS;
        bootVolume: BootVolume;
        currentDir: string;
        openFile: (path: string) => void;
    }
}

namespace composer.fs {
    export const Context = createContext<composer.FileSystemContext | null>(null);
    Context.displayName = "FileSystemContext";

    export function useFileSystem() {
        const ctx = useContext(Context);
        if (!ctx) throw new Error("useFileSystem must be inside FileSystemProvider");
        return ctx;
    }
}

export const fs = composer.fs;
export { composer };
