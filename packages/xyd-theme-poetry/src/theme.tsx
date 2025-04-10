import { BaseTheme } from "@xyd-js/themes"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePoetry extends BaseTheme {
    constructor() {
        super();

        this.sidebar.clientSideRouting(true);
    }
}

