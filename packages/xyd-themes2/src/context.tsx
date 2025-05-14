import { createContext } from "react";

import { BaseTheme } from "./BaseTheme";

export const PageContext = createContext<{
    theme: BaseTheme | null
}>({
    theme: null
})