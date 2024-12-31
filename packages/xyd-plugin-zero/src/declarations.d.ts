// declarations.d.ts

declare module 'virtual:xyd-settings' {
    import {Settings} from "@xyd/core";

    const settings: Settings;
    export default settings;
}

declare module 'virtual:xyd-theme' {
    import {Settings} from "@xyd/core";
    import type {FwSidebarGroupProps} from "@xyd/framework";
    import type {ITOC, IBreadcrumb, INavLinks} from "@xyd/ui2";

    interface ThemeProps<T> {
        children: JSX.Element | JSX.Element[];

        settings: Settings;
        sidebarGroups: FwSidebarGroupProps[];
        toc?: ITOC[];
        breadcrumbs?: IBreadcrumb[];
        navlinks?: INavLinks;

        themeSettings?: T;
    }

    const Theme: React.ComponentType<ThemeProps>;
    export default Theme;
}