// @ts-nocheck
// Simulates a _merged.ts file: all namespaces merged into one file.
// This triggers the typia "natives" path for Mode/Model type aliases,
// which must resolve as $xor (not String.prototype methods).

import { createContext, useContext } from "react";

namespace composer {
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

namespace composer.chat {
    export const Context = createContext<composer.ChatContext | null>(null);
    Context.displayName = "ComposerChatContext";

    export function useChat() {
        const ctx = useContext(Context);
        if (!ctx) throw new Error("useChat must be inside ChatProvider");
        return ctx;
    }
}

export const chat = composer.chat;

namespace composer.fs {
    export const Context = createContext<composer.FileSystemContext>({
        files: [],
        currentDir: "/",
        openFile: () => {},
    });
    Context.displayName = "FileSystemContext";

    export function useFileSystem() {
        return useContext(Context);
    }
}

export const fs = composer.fs;

export { composer };
