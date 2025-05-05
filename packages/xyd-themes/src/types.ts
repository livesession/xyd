import * as React from "react";

import {Theme} from "./Theme";

interface ThemeProps<T extends Theme> {
    children: React.ReactNode;
    Content: any

    settings?: T;
}

export type {ThemeProps};