export namespace app.vfs {
    export interface OpenFileEntry {
        path: string;
        mode: "read" | "write";
    }

    export interface VFS {
        openFileTable: Map<number, OpenFileEntry>;
        nextOpenFileId: number;
        open(path: string, mode: "read" | "write"): number;
        close(fd: number): void;
        read(fd: number, length: number): Uint8Array;
        write(fd: number, data: Uint8Array): number;
    }

    export interface Volume {
        id: string;
        label: string;
        resolve(path: string): string;
        createFile(path: string, content: string): void;
        listDir(path: string): string[];
    }
}

export namespace app {
    export interface FileSystemContext {
        vfs: vfs.VFS;
        bootVolume: vfs.Volume;
    }
}