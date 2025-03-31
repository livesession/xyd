import * as React from "react";

import {BaseThemeSettings} from "./settings";

interface ThemeProps<T extends BaseThemeSettings> {
    children: React.ReactNode;

    settings?: T;
}

export type {ThemeProps};