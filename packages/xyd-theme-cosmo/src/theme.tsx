import {BaseTheme} from "@xyd-js/themes"

import {syntaxThemeCosmo} from "./syntaxTheme"

import "./imports.css"

import "@xyd-js/themes/index.css"

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



