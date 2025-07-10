import { BaseTheme } from "@xyd-js/themes"

import { syntaxThemeCosmo } from "./syntaxTheme"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemeCosmo extends BaseTheme {
    constructor() {
        super();

        if (this.settings?.coder) {
            this.settings.coder.syntaxHighlight = syntaxThemeCosmo;
        } else {
            this.settings.coder = {
                syntaxHighlight: syntaxThemeCosmo,
            }
        }
    }
}



