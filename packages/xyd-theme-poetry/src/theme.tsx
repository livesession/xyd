import React from "react"

import {
    BaseTheme,
    BaseThemeSettings,

    withTheme,

    type ThemeProps,
} from "@xyd-js/themes"

import "@xyd-js/components/index.css"; // TODO: ui and components should be impoted via base theme?
import "@xyd-js/ui/index.css"; // TODO: ui and components should be impoted via base theme?
import '@xyd-js/atlas/index.css';
import "@xyd-js/atlas/tokens.css"

import './index.css';
import './vars.css';
import './override.css';

class ThemePoetry extends BaseTheme {
    static new(props: ThemeProps<BaseThemeSettings>) {
        const theme = new ThemePoetry();
        theme.sidebar.clientSideRouting(true);
        theme.mergeSettings(props);

        return theme.render(props);
    }
}

export default withTheme(ThemePoetry)
