import { createContext, useContext } from "react";
import type { app } from "./types";

export namespace myapp.chat {
    export const Context = createContext<app.ChatContext | null>(null);
    Context.displayName = "ChatContext";

    export function useChat() {
        const ctx = useContext(Context);
        if (!ctx) throw new Error("useChat must be inside ChatProvider");
        return ctx;
    }
}

export const chat = myapp.chat;