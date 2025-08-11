import { WebEditorHeader } from "@xyd-js/core";

import { useSettings } from "../contexts";

export function useHeaderItems() {
    const settings = useSettings()

    const header = settings?.webeditor?.header || []

    const headerMap = header.reduce<Record<string, WebEditorHeader[]>>((acc, item) => {
        const float = item.float || "default";
        return {
            ...acc,
            [float]: [...(acc[float] || []), item]
        };
    }, {});

    return {
        default: headerMap["default"] || [],
        center: headerMap["center"] || [],
        right: headerMap["right"] || [],
    }
}