import { createContext, useContext } from "react";
import type { app } from "./types";

export const FsContext = createContext<app.FileSystemContext | null>(null);

export function FileExplorer({ label }: { label: string }) {
    const fs = useContext(FsContext);
    if (!fs) return <div>No filesystem</div>;
    return (
        <div>
            <h3>{label}</h3>
            <p>Boot: {fs.bootVolume.id}</p>
            <p>Open files: {fs.vfs.nextOpenFileId}</p>
        </div>
    );
}