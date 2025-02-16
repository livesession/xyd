// declarations.d.ts


declare module 'virtual:xyd-settings' {
    import type {Settings} from "@xyd-js/core";

    const settings: Settings;
    export default settings;
}

declare module 'virtual:xyd-theme' {
    import type {ITheme} from "@xyd-js/framework";

    // TODO: fix any
    const Theme: React.ComponentType<ITheme<any>>;
    export default Theme;
}