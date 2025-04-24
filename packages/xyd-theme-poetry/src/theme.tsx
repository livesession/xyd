import { Theme as ThemeSettings } from "@xyd-js/core"
import { BaseTheme } from "@xyd-js/themes"

import "./imports.css"

import "@xyd-js/themes/index.css"

import './index.css';
import './override.css';
import './vars.css';

export default class ThemePoetry extends BaseTheme {
    constructor(settings: ThemeSettings) {
        super(settings);
    }
}

export const TEST = "123"


