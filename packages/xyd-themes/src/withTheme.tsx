import React from "react";

import {type ThemeProps} from "./types";
import {BaseThemeSettings} from "./settings";
import {BaseTheme} from "./BaseTheme";

export function withTheme<T extends BaseThemeSettings>(theme: BaseTheme) {
    return function WithThemeComponent(props: ThemeProps<T>) {
        return withThemeComponent.call(theme, props);
    };
}

function withThemeComponent<T extends BaseThemeSettings>(
    this: BaseTheme,
    props: ThemeProps<T>
) {
    this.mergeSettings(props); // TODO: is it ok to do this on this level?

    return this.render(props);
}