export namespace app {
    export type Mode = "auto" | "plan" | "manual" | "ask";
    export type Model = "claude" | "gpt-4" | "gemini";

    export interface ChatContext {
        messages: string[];
        isLoading: boolean;
        mode: Mode;
        setMode: (mode: Mode) => void;
        model: Model;
        setModel: (model: Model) => void;
        sendMessage: (text: string) => void;
    }

    export interface FileSystemContext {
        files: Array<{ path: string; content: string }>;
        currentDir: string;
        openFile: (path: string) => void;
    }
}