import { Segment } from "@xyd-js/core";

import { useSettings } from "../contexts";

// TODO: better data structures
export function useTabSegments(): Segment | null {
    const settings = useSettings()

    const tabs = settings.navigation?.tabs || []

    if (tabs?.length) {
        return {
            route: "",
            title: "",
            pages: tabs,
        }
    }

    return null
}

