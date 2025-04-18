import React from "react";

import {type ThemeProps} from "./types";
import {Theme} from "./Theme";
import {BaseTheme} from "./BaseTheme";

export function withTheme<T extends Theme>(theme: BaseTheme) {
    return function WithThemeComponent(props: ThemeProps<T>) {
        return withThemeComponent.call(theme, props);
    };
}

function withThemeComponent<T extends Theme>(
    this: BaseTheme,
    props: ThemeProps<T>
) {
    this.mergeSettings(props); // TODO: is it ok to do this on this level?

    return this.render(props);
}