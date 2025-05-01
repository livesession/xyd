// declarations.d.ts


declare module 'virtual:xyd-settings' {
    import type {Settings} from "@xyd-js/core";

    const settings: Settings;
    export default settings;
}

declare module 'virtual:xyd-theme' {
    import {BaseTheme} from "@xyd-js/themes";
    import {Theme as ThemeSettings} from "@xyd-js/core";

    // Export a concrete theme class that extends BaseTheme
    class ConcreteTheme extends BaseTheme {
        constructor(settings: ThemeSettings, surfaces: any);
    }
    export default ConcreteTheme;
}