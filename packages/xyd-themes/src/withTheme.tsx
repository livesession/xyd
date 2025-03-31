import React from "react";

import {type ThemeProps} from "./types";
import {BaseThemeSettings} from "./settings";

type ThemeClass<T extends BaseThemeSettings> = {
    new (): BaseThemeSettings;
    new: (props: ThemeProps<T>) => React.ReactElement;
};

export function withTheme<T extends BaseThemeSettings>(Component: ThemeClass<T>) {
    return function WithThemeComponent(props: ThemeProps<T>) {
        let settings = props.settings;

        if (typeof props.settings === "function") {
            settings = (props.settings as () => T).call(new Component()); // TODO: check performance
        }

        return Component.new({
            ...props,
            settings
        });
    };
}