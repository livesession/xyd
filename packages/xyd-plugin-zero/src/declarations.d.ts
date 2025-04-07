// declarations.d.ts


declare module 'virtual:xyd-settings' {
    import type {Settings} from "@xyd-js/core";

    const settings: Settings;
    export default settings;
}

declare module 'virtual:xyd-theme' {
    import type {ThemeProps} from "@xyd-js/themes";

    // TODO: fix any
    const Theme: React.ComponentType<ThemeProps<any>>;
    export default Theme;
}