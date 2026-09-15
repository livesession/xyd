// @ts-nocheck
// Reproduces: in the FALLBACK path (when typia is skipped), nested named
// types must recurse — Tab inside Tab[] must expose its inner properties,
// AND properties OF Tab that are themselves named/nullable types
// (e.g. `previewEngine: PreviewEngine | undefined`) must also recurse.

import { createContext, useContext, type PropsWithChildren } from "react";

namespace composer {
    // Discriminated union — type alias to a union of named interfaces.
    // The fallback's typeResolver should resolve this to a $$union of variants,
    // not return a raw "PreviewEngine | undefined" string.
    export type PreviewEngine = PreviewEngineChat | PreviewEngineClaude;

    export interface PreviewEngineChat {
        name: "chat";
        messages: string[];
    }

    export interface PreviewEngineClaude {
        name: "claude";
        renderer: string;
    }

    export interface TabProcessing {
        todos: string[];
        isProcessing: boolean;
    }

    export interface Tab {
        id: string;
        label: string;
        active: boolean;
        previewEngine: PreviewEngine | undefined;
        processing: TabProcessing | undefined;
    }

    export interface HistoryItem {
        id: string;
        prompt: string;
        timestamp: number;
    }

    export interface ChatContext {
        panelTabs: Tab[];
        history: HistoryItem[];
        activeTab: Tab | undefined;
        activeTabId: string | null;
    }
}

namespace composer.chat {
    // No React. in propsType → typia handles this directly (not fallback)
    export const Context = createContext<composer.ChatContext | null>(null);
    Context.displayName = "ComposerChatContext";

    export function useChat() {
        const ctx = useContext(Context);
        if (!ctx) throw new Error("useChat must be inside ChatProvider");
        return ctx;
    }
}

export const chat = composer.chat;
export { composer };
