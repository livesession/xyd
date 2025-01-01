import {createContext, useContext} from "react";

import type {ITheme} from "@xyd/framework";

const theme = createContext<ITheme<any> | null>(null)

const Provider = theme.Provider

// TODO: finish theme context

export function withTheme(Component) {
    return <Provider value={null}>
        <Component/>
    </Provider>
}

export function useTheme<T>(): ITheme<any> | null {
    return useContext(theme)
}
