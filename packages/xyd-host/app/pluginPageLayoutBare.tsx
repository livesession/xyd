import { Outlet } from "react-router";

/**
 * Bare layout for plugin pages with layoutCss: false.
 * No theme CSS — fully standalone pages with no xyd design token dependency.
 */
export default function PluginPageLayoutBare() {
    return <Outlet />;
}