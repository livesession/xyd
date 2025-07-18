import {BaseTheme} from "@xyd-js/themes"

import syntaxThemeCosmo from "@xyd-js/components/coder/themes/cosmo.js"

import "./imports.css"

import "@xyd-js/themes/index.css"
import "@xyd-js/components/coder/themes/cosmo.css"

import './index.css';
import './vars.css';
import './override.css';

export default class ThemeCosmo extends BaseTheme {
    constructor() {
        super();

        this.theme.Update({
            coder: {
                syntaxHighlight: syntaxThemeCosmo
            }
        })
    }
}



