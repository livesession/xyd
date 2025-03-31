import {
    BaseTheme,
    BaseThemeSettings,

    withTheme,

    type ThemeProps,
} from "@xyd-js/themes"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

class ThemePoetry extends BaseTheme {
    static new(props: ThemeProps<BaseThemeSettings>) {
        const theme = new ThemePoetry();
        theme.sidebar.clientSideRouting(true);
        theme.mergeSettings(props);

        return theme.render(props);
    }
}

export default withTheme(ThemePoetry)
