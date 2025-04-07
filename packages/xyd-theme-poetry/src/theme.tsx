import {
    BaseTheme,

    withTheme,
} from "@xyd-js/themes"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

class ThemePoetry extends BaseTheme {
    constructor() {
        super();

        this.sidebar.clientSideRouting(true);
    }
}

export default withTheme(new ThemePoetry())

