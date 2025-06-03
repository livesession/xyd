import { createContext } from "react";

import { BaseTheme } from "@xyd-js/themes";

export const PageContext = createContext<{
    theme: BaseTheme | null
}>({
    theme: null
})