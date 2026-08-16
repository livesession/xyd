import { createContext, useContext } from "react";
import type { app } from "./types";

export namespace myapp.fs {
    export const Context = createContext<app.FileSystemContext>({
        files: [],
        currentDir: "/",
        openFile: () => {},
    });
    Context.displayName = "FileSystemContext";

    export function useFileSystem() {
        return useContext(Context);
    }
}

export const fs = myapp.fs;