// @ts-nocheck
// Reproduces: in the FALLBACK path (when typia is skipped), nested named
// types must recurse — Tab inside Tab[] must expose its inner properties,
// AND properties OF Tab that are themselves named/nullable types
// (e.g. `previewEngine: PreviewEngine | undefined`) must also recurse.

import { createContext, useContext, type PropsWithChildren } from "react";

namespace composer {
    // Discriminated union (type alias to union of named interfaces) —
    // typia / fallback should resolve at least its variants, not emit a
    // raw "PreviewEngine | undefined" string.
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
        toggle: () => void;
        setOpen: (open: boolean) => void;
        addPanelTab: (tab: Tab, setActive?: boolean) => void;
    }
}

namespace composer.chat {
    // React.PropsWithChildren in the type forces typia to skip → fallback runs
    export const Context = createContext<React.PropsWithChildren<composer.ChatContext> | null>(null);
    Context.displayName = "ComposerChatContext";

    export function useChat() {
        const ctx = useContext(Context);
        if (!ctx) throw new Error("useChat must be inside ChatProvider");
        return ctx;
    }
}

export const chat = composer.chat;
export { composer };
