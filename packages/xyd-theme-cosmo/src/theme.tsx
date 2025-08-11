import { BaseTheme } from "@xyd-js/themes"

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
            },
            appearance: {
                logo: {
                    header: true
                },
                header: {
                    buttonSize: "sm"
                },
                footer: {
                    surface: "page"
                },
                search: {
                    fullWidth: true,
                    sidebar: "mobile",
                    middle: "desktop"
                },
                sidebar: {
                    scrollShadow: true,
                }
            }
        })


        if (this.theme?.appearance?.colors?.primary) {
            this.theme.Update({
                appearance: {
                    cssTokens: {
                        "--syntax-primary": "var(--color-primary)",
                        "--syntax-secondary": "var(--color-text)",
                        "--syntax-tertiary": "var(--color-text)",
                    }
                }
            })
        }
    }
}



