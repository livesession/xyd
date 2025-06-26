import {
    index,
    route,
} from "@react-router/dev/routes";
import {pathRoutes} from "./pathRoutes";

// Declare the global property type
declare global {
    var __xydBasePath: string;
}

const basePath = globalThis.__xydBasePath

const navigation = __xydSettings?.navigation || {sidebar: []};
const docsRoutes = pathRoutes(basePath, navigation)

// TODO: !!!! if not routes found then '*' !!!
export const routes = [
    ...docsRoutes,

    // TODO: in the future better sitemap + robots.txt
    route("/sitemap.xml", "./sitemap.ts"),
    route("/robots.txt", "./robots.ts"),
    route(
        "/.well-known/appspecific/com.chrome.devtools.json",
        "./debug-null.tsx",
    ),
]

if (globalThis.__xydStaticFiles?.length) {
    routes.push(route("/public/*", "./public.ts"))
}

export default routes

