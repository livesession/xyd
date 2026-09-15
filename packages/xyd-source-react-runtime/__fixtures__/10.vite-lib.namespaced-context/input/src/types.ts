export namespace app {
    export interface ChatContext {
        messages: string[];
        isLoading: boolean;
        sendMessage: (text: string) => void;
        clearHistory: () => void;
    }

    export interface FileSystemContext {
        files: Array<{ path: string; content: string }>;
        currentDir: string;
        openFile: (path: string) => void;
    }
}