import {join, relative, sep} from "node:path";
import {exec} from "node:child_process";
import {promisify} from "node:util";
import {existsSync} from "node:fs";
import {readdir, readFile, rm, writeFile} from "node:fs/promises";

import {createProcessor} from "@mdx-js/mdx";
import {remark} from "remark";
import remarkDirective from "remark-directive";
import remarkStringify from "remark-stringify";

import {Settings as XydSettings} from "@xyd-js/core";

import {
    AnchorsSchema,
    DropdownsSchema,
    GroupsSchema,
    MintlifyJSON,
    TabsSchema,
    VersionSchema,
} from "./types";

// ----------------------------------------------------------------------------
// Public API — keep names & signatures stable for drop‑in replacement
// ----------------------------------------------------------------------------

export async function isMintlify(docsPath: string, fileName: string) {
    if (!MintlifyMigrator.validMintlifyJsonFile(fileName)) return false;

    console.log("Found docs.json file, checking if it's Mintlify...");

    const docsJsonPath = join(docsPath, fileName);
    const content = await readFile(docsJsonPath, "utf-8");

    let data: unknown = null;
    try {
        data = JSON.parse(content);
    } catch (_) {
        // ignore
    }

    if (MintlifyMigrator.isMintlifyJson(data)) {
        console.log("✅ Mintlify framework detected!");
        return true;
    } else {
        console.log("❌ docs.json found but not a valid Mintlify configuration");
        return false;
    }
}

export async function mintlifyMigrator(docsPath: string) {
    return new MintlifyMigrator(docsPath).run();
}

// ----------------------------------------------------------------------------
// Implementation
// ----------------------------------------------------------------------------

const sh = promisify(exec);

class Logger {
    constructor(private readonly enabled = true) {
    }

    info = (...args: any[]) => this.enabled && console.log(...args);
    warn = (...args: any[]) => this.enabled && console.warn(...args);
    error = (...args: any[]) => console.error(...args);
    debug = (...args: any[]) => this.enabled && console.log(...args);
}

class MintlifyMigrator {
    // ------ static helpers kept public-ish for unit reuse ------
    static validMintlifyJsonFile = (fileName: string) =>
        fileName === "docs.json" || fileName === "mint.json";

    static isMintlifyJson(data: any): boolean {
        return !!(data && typeof data === "object" && data.$schema === "https://mintlify.com/docs.json");
    }

    // ----------------------------------------------------------
    private logger = new Logger(true);

    private docsJsonPath = "";
    private publicDir = "";
    private docsJson!: MintlifyJSON;
    private xydSettings!: XydSettings;

    constructor(private readonly docsPath: string) {
    }

    async run() {
        this.logger.info("⏳Starting Mintlify migration...");

        // 1) resolve docs.json / mint.json
        this.docsJsonPath = join(this.docsPath, "docs.json");
        try {
            if (!existsSync(this.docsJsonPath)) {
                this.docsJsonPath = join(this.docsPath, "mint.json");
            }
        } catch (_) {
            this.docsJsonPath = join(this.docsPath, "mint.json");
        }

        this.docsJson = JSON.parse(await readFile(this.docsJsonPath, "utf-8")) as MintlifyJSON;
        if (!this.docsJson) {
            this.logger.error("Invalid Mintlify configuration: missing or incorrect.");
            return;
        }

        // 2) prepare settings & public dir
        this.xydSettings = this.preSettings(this.docsJson);
        await this.ensurePublicDir();

        // 3) migrate docs.json → xyd settings
        await this.mintlifyDocsJsonToXydSettings();

        // 4) write xyd settings
        await writeFile(join(this.docsPath, "docs.json"), JSON.stringify(this.xydSettings, null, 2));

        // 5) migrate content files
        await this.migrateContent();

        this.logger.info("✅ Mintlify migration completed!");
    }

    // ---------------------------------------------------------------------------
    // Stage 0: bootstrap
    // ---------------------------------------------------------------------------
    private preSettings(docsJson: MintlifyJSON): XydSettings {
        let theme = "gusto";

        if (docsJson.theme && docsJson.theme === "maple") {
            theme = "gusto";
        } else if (docsJson.theme && docsJson.theme === "mint") {
            theme = "solar";
        }

        return {
            theme: {
                name: theme,
                icons: {
                    library: [
                        {
                            name: "fa6-solid", // TODO: mintlify supports lucide icons too
                            default: true,
                        },
                    ],
                },
                writer: {
                    maxTocDepth: 4,
                },
            },
            webeditor: {
                header: [],
            },
            navigation: {
                tabs: [],
                sidebar: [],
            },
            components: {},
        };
    }

    private async ensurePublicDir() {
        this.publicDir = join(this.docsPath, "public");
        try {
            await readdir(this.publicDir);
        } catch {
            this.logger.info("Creating public directory...");
            await sh(`mkdir -p "${this.publicDir}"`);
        }
    }

    // ---------------------------------------------------------------------------
    // Stage 1: docs.json → settings
    // ---------------------------------------------------------------------------
    private async mintlifyDocsJsonToXydSettings() {
        // 1. navigation
        this.migrateNavigation();

        // 2. colors
        this.migrateColors();

        // 3. logo
        await this.migrateLogo();

        // 4. favicon
        await this.migrateFavicon();

        // 5. public resources
        await this.migratePublicResources();

        // 6. navbar links
        this.migrateNavbarLinks();

        // 7. footer
        this.migrateFooter();

        // 8. redirects
        this.migrateRedirects();

        // 9. seo
        this.migrateSeo();
    }

    // ---------------------------------------------------------------------------
    // Navigation
    // ---------------------------------------------------------------------------
    private migrateNavigation() {
        const docsJson = this.docsJson;
        const xydSettings = this.xydSettings;

        const migrateNav = (
            navs: GroupsSchema | TabsSchema | DropdownsSchema | AnchorsSchema | VersionSchema[]
        ) => {
            for (const nav of navs as any[]) {
                const hasHref = "href" in nav && nav.href;
                const hasGroups =
                    ("groups" in nav && nav.groups) || ("pages" in nav && nav.pages && this.hasNestedGroups(nav.pages));
                const hasPages = "pages" in nav && nav.pages;

                let title = "";
                if ("group" in nav) title = nav.group;
                else if ("tab" in nav) title = nav.tab;
                else if ("dropdown" in nav) title = nav.dropdown;
                else if ("anchor" in nav) title = nav.anchor;

                const headerEntry: any = {
                    title,
                    icon: "icon" in nav ? (typeof nav.icon === "string" ? nav.icon : (nav.icon as any)?.name) : "",
                };

                // Debug
                this.logger.debug(`\n--- Processing anchor: ${title} ---`);
                this.logger.debug(`hasHref: ${!!hasHref}`);
                this.logger.debug(`hasGroups: ${!!hasGroups}`);
                this.logger.debug(`hasPages: ${!!hasPages}`);
                this.logger.debug(`nav object keys:`, Object.keys(nav));
                if ("groups" in nav) this.logger.debug(`groups length:`, (nav as any)?.groups?.length);
                if ("pages" in nav) this.logger.debug(`pages length:`, (nav as any)?.pages?.length);
                if ("pages" in nav && nav.pages) this.logger.debug(`hasNestedGroups:`, this.hasNestedGroups(nav.pages));

                if (hasHref && !hasGroups && !hasPages) {
                    // External link
                    headerEntry.href = nav.href;
                    headerEntry.float = "right";
                    this.logger.debug(`Created external header link: ${title} -> ${nav.href}`);
                } else if (hasGroups) {
                    // Complex navigation → create page route
                    let route = title.toLowerCase().replace(/\s+/g, "-");

                    if ("pages" in nav && nav.pages && !("groups" in nav && nav.groups)) {
                        if (this.isFlatStructure(nav.pages)) {
                            // flat sidebar (no route)
                            this.logger.debug(`Detected flat structure for ${title}, creating flat sidebar`);
                            headerEntry.page = "";

                            const flatSidebarPages: any[] = [];
                            for (const pageOrGroup of nav.pages) {
                                if (typeof pageOrGroup === "string") {
                                    if (pageOrGroup === "index") {
                                        this.logger.warn("currently skipping index page in sidebar");
                                        continue;
                                    }
                                    flatSidebarPages.push(pageOrGroup);
                                } else if (typeof pageOrGroup === "object" && pageOrGroup.group && (pageOrGroup as any).pages) {
                                    for (const nestedPage of (pageOrGroup as any).pages) {
                                        if (nestedPage === "index") {
                                            this.logger.warn("currently skipping index page in sidebar");
                                            continue;
                                        }
                                        flatSidebarPages.push(nestedPage);
                                    }
                                }
                            }

                            xydSettings.navigation!.sidebar!.push(...flatSidebarPages);
                            this.logger.debug(`Created flat sidebar for ${title} with ${flatSidebarPages.length} pages`);
                            xydSettings.navigation!.tabs!.push(headerEntry);
                            continue;
                        } else {
                            const firstPage = nav.pages[0];
                            if (typeof firstPage === "string") route = firstPage;
                            else if (typeof firstPage === "object" && (firstPage as any).pages && (firstPage as any).pages[0])
                                route = (firstPage as any).pages[0];
                        }
                    }

                    headerEntry.page = route;
                    this.logger.debug(`Created complex header page: ${title} -> ${route}`);

                    const sidebarPages: any[] = [];

                    if ("groups" in nav && nav.groups) {
                        this.logger.debug(`Creating route structure for tab with groups: ${title}`);
                        for (const group of (nav.groups as any[]) ?? []) {
                            if ("pages" in group && group.pages) {
                                const pages: any[] = [];
                                for (const pageOrGroup of group.pages) {
                                    if (pageOrGroup === "index") {
                                        this.logger.warn("currently skipping index page in sidebar");
                                        continue;
                                    }
                                    pages.push(pageOrGroup);
                                }
                                sidebarPages.push({group: (group as any).group, pages});
                            }
                            // skip API-related groups (openapi/asyncapi)
                        }
                    } else if ("pages" in nav && nav.pages) {
                        for (const pageOrGroup of nav.pages) {
                            if (typeof pageOrGroup === "string") {
                                if (pageOrGroup === "index") {
                                    this.logger.warn("currently skipping index page in sidebar");
                                    continue;
                                }
                                sidebarPages.push(pageOrGroup);
                            } else if (typeof pageOrGroup === "object" && pageOrGroup.group && (pageOrGroup as any).pages) {
                                sidebarPages.push({group: pageOrGroup.group, pages: (pageOrGroup as any).pages});
                            }
                        }
                    }

                    const isValidRoute = this.validateRoutePages(route, sidebarPages);
                    if (isValidRoute) {
                        xydSettings.navigation!.sidebar!.push({route, pages: sidebarPages});
                        this.logger.debug(`Created sidebar route: ${route} for anchor: ${title}`);
                    } else {
                        this.logger.debug(`Invalid route pattern for ${title} - adding pages directly to sidebar`);
                        xydSettings.navigation!.sidebar!.push(...sidebarPages);
                        headerEntry.page = "";
                        const firstPage = this.findFirstPage(sidebarPages);
                        if (firstPage) {
                            headerEntry.href = "/" + firstPage;
                            this.logger.debug(`Set href for non-route tab ${title}: ${headerEntry.href}`);
                        }
                    }
                } else if (hasPages && !hasGroups) {
                    headerEntry.page = "";
                    if ("pages" in nav && nav.pages && nav.pages.length > 0) {
                        const firstPage = nav.pages[0];
                        if (typeof firstPage === "string") {
                            headerEntry.href = firstPage;
                            this.logger.debug(
                                `Created simple header page: ${title} -> empty page with href: ${firstPage}`
                            );
                        }
                    } else {
                        this.logger.debug(`Created simple header page: ${title} -> empty page (no href found)`);
                    }
                    xydSettings.navigation!.sidebar!.push(title.toLowerCase().replace(/\s+/g, "-"));
                    this.logger.debug(`Added simple sidebar entry: ${title}`);
                }

                xydSettings.navigation!.tabs!.push(headerEntry);
            }
        };

        if ("groups" in docsJson.navigation) {
            this.logger.info("Migrating groups...");
            migrateNav(docsJson.navigation.groups);
        }
        if ("tabs" in docsJson.navigation) {
            this.logger.info("Migrating links...");
            migrateNav(docsJson.navigation.tabs);
        }
        if ("anchors" in docsJson.navigation) {
            this.logger.info("Migrating anchors...");
            migrateNav(docsJson.navigation.anchors);
        }
        if ("dropdowns" in docsJson.navigation) {
            this.logger.info("Migrating dropdowns...");
            migrateNav(docsJson.navigation.dropdowns);
        }
        if ("versions" in docsJson.navigation) {
            this.logger.info("\n\x1b[33m⚠️  Note: Version navigation is not currently supported\x1b[0m");
            this.logger.info("\x1b[33m   Only the first version navigation will be created\x1b[0m");
            this.logger.info("\x1b[36m   📋 Roadmap: https://github.com/orgs/livesession/projects/4\x1b[0m\n");

            if (docsJson.navigation?.versions?.length) {
                const firstVersion = docsJson.navigation.versions[0];
                if ("groups" in firstVersion && (firstVersion as any).groups) migrateNav([firstVersion] as any);
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Theme & branding
    // ---------------------------------------------------------------------------
    private migrateColors() {
        const {docsJson, xydSettings} = this;
        if (!docsJson.colors) return;

        this.logger.info("Migrating theme colors...");
        xydSettings.theme!.appearance ||= {} as any;
        xydSettings.theme!.appearance!.colors = {
            primary: docsJson.colors.primary,
            dark: docsJson.colors.dark,
            light: docsJson.colors.light,
        } as any;
    }

    private async migrateLogo() {
        const {docsJson} = this;
        if (!docsJson.logo) return;
        this.logger.info("Migrating logo...");

        if (typeof docsJson.logo === "string") {
            (this.xydSettings.theme as any).logo = await this.moveResourceToPublic(docsJson.logo);
        } else if (typeof docsJson.logo === "object") {
            (this.xydSettings.theme as any).logo = {
                light: await this.moveResourceToPublic(docsJson.logo.light),
                dark: await this.moveResourceToPublic(docsJson.logo.dark),
                href: docsJson.logo.href,
            } as any;
        }
    }

    private async migrateFavicon() {
        const {docsJson} = this;
        if (!docsJson.favicon) return;
        this.logger.info("Migrating favicon...");

        if (typeof docsJson.favicon === "string") {
            (this.xydSettings.theme as any).favicon = await this.moveResourceToPublic(docsJson.favicon);
        } else if (typeof docsJson.favicon === "object") {
            const lightFavicon = await this.moveResourceToPublic(docsJson.favicon.light);
            const darkFavicon = await this.moveResourceToPublic(docsJson.favicon.dark);
            (this.xydSettings.theme as any).favicon = lightFavicon || darkFavicon;
        }
    }

    private migrateNavbarLinks() {
        const {docsJson, xydSettings} = this;
        if (!docsJson.navbar?.links) return;
        this.logger.info("Migrating navbar links...");

        xydSettings.webeditor!.header = docsJson.navbar.links.map((link) => ({
            title: link.label,
            href: link.href,
            icon: typeof link.icon === "string" ? link.icon : (link.icon as any)?.name,
            float: "right",
        }));
    }

    private migrateFooter() {
        const {docsJson, xydSettings} = this;
        if (!docsJson.footer) return;
        this.logger.info("Migrating footer...");

        const xydSocials: Record<string, string> = {};
        if (docsJson.footer.socials) {
            const supported = [
                "x",
                "facebook",
                "youtube",
                "discord",
                "slack",
                "github",
                "linkedin",
                "instagram",
                "hackernews",
                "medium",
                "telegram",
                "bluesky",
                "reddit",
            ];
            for (const [platform, url] of Object.entries(docsJson.footer.socials)) {
                if (supported.includes(platform)) xydSocials[platform] = url as string;
            }
        }

        (xydSettings.components as any)!.footer = {
            social: Object.keys(xydSocials).length > 0 ? xydSocials : undefined,
            links: docsJson.footer.links?.map((group) => ({
                header: group.header || "",
                items: group.items.map((item) => ({label: item.label, href: item.href})),
            })),
        };
    }

    private migrateRedirects() {
        if (this.docsJson.redirects) {
            this.logger.warn("Currently redirects are not supported in xyd.");
            // Intentionally left – parity with original
        }
    }

    private migrateSeo() {
        if (!this.docsJson.seo) return;
        this.logger.info("Migrating SEO...");
        (this.xydSettings as any).seo = {metatags: this.docsJson.seo.metatags || undefined};
    }

    // ---------------------------------------------------------------------------
    // Assets
    // ---------------------------------------------------------------------------
    private async moveResourceToPublic(resourcePath: string | undefined): Promise<string> {
        if (!resourcePath) return "";

        const cleanPath = resourcePath.startsWith("/") ? resourcePath.slice(1) : resourcePath;
        if (cleanPath.startsWith("public/")) return `/${cleanPath}`;

        const sourcePath = join(this.docsPath, cleanPath);

        try {
            await readFile(sourcePath); // ensure exists

            const relativePath = cleanPath; // preserve structure verbatim
            const destPath = join(this.publicDir, relativePath);

            const destDir = destPath.substring(0, destPath.lastIndexOf("/"));
            try {
                await readdir(destDir);
            } catch {
                await sh(`mkdir -p "${destDir}"`);
            }

            await sh(`mv "${sourcePath}" "${destPath}"`);
            this.logger.info(`Moved resource: ${cleanPath} -> public/${relativePath}`);
            return `/public/${relativePath}`;
        } catch (_) {
            this.logger.info(`Resource not found or already in public: ${cleanPath}`);
            return resourcePath; // fallback to original
        }
    }

    private async migratePublicResources() {
        this.logger.info("Scanning for image resources...");

        const imageExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"]);

        const scan = async (currentDir: string) => {
            const items = await readdir(currentDir, {withFileTypes: true});
            for (const item of items) {
                const fullPath = join(currentDir, item.name);
                if (item.isDirectory()) {
                    if (!new Set(["node_modules", ".git", "dist", "build", "public"]).has(item.name)) {
                        await scan(fullPath);
                    }
                } else if (item.isFile()) {
                    const dot = item.name.lastIndexOf(".");
                    const ext = dot >= 0 ? item.name.toLowerCase().substring(dot) : "";
                    if (!imageExtensions.has(ext)) continue;

                    try {
                        const rel = relative(this.docsPath, fullPath).split(sep).join("/");
                        const destPath = join(this.publicDir, rel);
                        const destDir = destPath.substring(0, destPath.lastIndexOf("/"));
                        try {
                            await readdir(destDir);
                        } catch {
                            await sh(`mkdir -p "${destDir}"`);
                        }

                        try {
                            await readFile(destPath);
                            this.logger.info(`Image already exists in public: ${rel}`);
                        } catch {
                            await sh(`mv "${fullPath}" "${destPath}"`);
                            this.logger.info(`Moved image: ${fullPath} -> public/${rel}`);
                        }
                    } catch (error) {
                        this.logger.warn(`Error moving image ${item.name}:`, error);
                    }
                }
            }
        };

        await scan(this.docsPath);
    }

    // ---------------------------------------------------------------------------
    // Content (.mdx → .md)
    // ---------------------------------------------------------------------------
    private async migrateContent() {
        this.logger.info("Migrating content files...");

        const mdxFiles = await this.findMdxFiles(this.docsPath);
        this.logger.info(`Found ${mdxFiles.length} MDX files to migrate`);

        for (const mdxFile of mdxFiles) {
            await this.migrateMdxFile(mdxFile);
        }

        this.logger.info("✅ Content migration completed!");
    }

    private async findMdxFiles(dir: string): Promise<string[]> {
        const found: string[] = [];

        const scan = async (currentDir: string) => {
            const items = await readdir(currentDir, {withFileTypes: true});
            for (const item of items) {
                const fullPath = join(currentDir, item.name);
                if (item.isDirectory()) {
                    if (!["node_modules", ".git", "dist", "build"].includes(item.name)) {
                        await scan(fullPath);
                    }
                } else if (item.isFile() && item.name.endsWith(".mdx")) {
                    found.push(fullPath);
                }
            }
        };

        await scan(dir);
        return found;
    }

    private async migrateMdxFile(filePath: string) {
        try {
            const content = await readFile(filePath, "utf-8");
            const converted = await this.convertMDXComponents(content, filePath);
            const newFilePath = filePath.replace(/\.mdx$/, ".md");
            await writeFile(newFilePath, converted);
            await rm(filePath);
        } catch (error) {
            this.logger.error(`❌ Error migrating ${filePath}:`, error);
        }
    }

    private async convertMDXComponents(content: string, filePath: string): Promise<string> {
        try {
            this.logger.info("Processing MDX content...", filePath);

            let hasFrontmatter = content.startsWith("---");
            let frontmatter = "";
            let body = content;

            if (hasFrontmatter) {
                const end = content.indexOf("---", 3);
                if (end !== -1) {
                    frontmatter = content.substring(0, end + 3);
                    body = content.substring(end + 3);
                }
            } else {
                frontmatter = "---\ntitle: TODO\n---";
                hasFrontmatter = true;
            }

            const processor = createProcessor({jsx: true, development: false});
            const ast: any = await processor.parse(body);

            const originalMdxString = body;

            let title = "";
            let description = "";
            if (hasFrontmatter) {
                const fm = frontmatter.replace(/^---\n/, "").replace(/\n---$/, "");
                for (const line of fm.split("\n")) {
                    if (line.startsWith("title:")) {
                        title = line.replace("title:", "").trim();
                        title = title.replace(/^[\'\"`]|[\'\"`]$/g, "");
                        title = title.replace(/[\\`*_{}\[\]()#+\-!]/g, "\\$&");
                    } else if (line.startsWith("description:")) {
                        description = line.replace("description:", "").trim();
                        description = description.replace(/^[\'\"`]|[\'\"`]$/g, "");
                    }
                }
            }

            await this.transformMintlifyComponents(ast, originalMdxString);

            if (title || description) {
                const nodes: any[] = [];
                if (title) nodes.push({type: "heading", depth: 1, children: [{type: "text", value: title}]});
                if (description)
                    nodes.push({
                        type: "containerDirective",
                        name: "subtitle",
                        children: [{type: "text", value: description}]
                    });
                ast.children = [...nodes, ...ast.children];
            }

            try {
                const markdown = remark()
                    .use(remarkDirective as any)
                    .use(remarkStringify as any, {
                        bullet: "-",
                        fences: true,
                        listItemIndent: "one",
                        incrementListMarker: true,
                        quote: '"',
                        emphasis: "*",
                        strong: "*",
                        tightDefinitions: true,
                    })
                    .stringify(ast)
                    .replace(/&#x20;/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\\\[/g, "[")
                    .replace(/\\\]/g, "]")
                    .replace(/\\\(/g, "(")
                    .replace(/\\\)/g, ")");

                return frontmatter + "\n\n" + markdown;
            } catch (e) {
                await writeFile(join(this.docsPath, "ast.json"), JSON.stringify(ast, null, 2));
                this.logger.error("Error converting MDX to markdown", filePath);
                throw e;
            }
        } catch (error) {
            this.logger.error("Error processing MDX:", error);
            return content; // fallback
        }
    }

    // ---------------------------------------------------------------------------
    // AST transforms
    // ---------------------------------------------------------------------------
    private convertLightDarkImage(node: any): { colorScheme: string; src: string; alt: string } | null {
        const className = node.attributes?.find((a: any) => a.name === "className")?.value || "";
        let src = node.attributes?.find((a: any) => a.name === "src")?.value || "";
        const alt = node.attributes?.find((a: any) => a.name === "alt")?.value || "";

        if (className.includes("dark:hidden") || className.includes("dark:block")) {
            let colorScheme = "";
            if (className.includes("dark:hidden")) colorScheme = "light";
            else if (className.includes("dark:block")) colorScheme = "dark";

            if (src.startsWith("/") && !src.startsWith("/public/") && !src.startsWith("http://") && !src.startsWith("https://")) {
                src = `/public${src}`;
            }

            return {colorScheme, src, alt};
        }

        return null;
    }

    private async transformMintlifyComponents(ast: any, originalMdxString: string): Promise<any> {
        const includeMapping: Record<string, string> = {};

        const transformNode = async (node: any): Promise<any> => {
            if (!node) return null;

            const processedChildren: any[] = [];
            if (node.children) {
                for (const child of node.children) {
                    const processed = await transformNode(child);
                    if (!processed) continue;
                    if (Array.isArray(processed)) processedChildren.push(...processed);
                    else processedChildren.push(processed);
                }
            }

            // decode entities in text
            if (node.type === "text" && node.value) {
                node.value = node.value
                    .replace(/&#x20;/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
            }

            if (node.type === "mdxjsEsm") {
                const importStatement = node.value || "";
                const importMatch = importStatement.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/);
                if (importMatch) {
                    const [, componentName, importPath] = importMatch;
                    let xydPath = importPath;
                    if (importPath.startsWith("./") || importPath.startsWith("/")) {
                        xydPath = importPath.replace(/^\.?\//, "~/").replace(/\.mdx$/, ".md");
                    }
                    this.logger.debug("importMappings", componentName, xydPath);
                    includeMapping[componentName] = xydPath;
                    return null; // strip import
                }
                return {type: "html", value: `<!-- Import statement not supported: ${importStatement} -->`};
            }

            if (
                node.type === "mdxJsxFlowElement" ||
                node.type === "mdxJsxTextElement" ||
                node.type === "mdxFlowExpression"
            ) {
                const componentName = node.name;
                const children = processedChildren;

                switch (componentName) {
                    case "img": {
                        const imageData = this.convertLightDarkImage(node);
                        if (imageData) {
                            return {
                                type: "html",
                                value: `<img src="${imageData.src}" alt="${imageData.alt}" data-color-scheme="${imageData.colorScheme}" />`,
                            };
                        }
                        break;
                    }

                    case "Columns":
                    case "CardGroup": {
                        const colsAttr = node.attributes?.find((a: any) => a.name === "cols");
                        let cols = "2";
                        if (typeof colsAttr?.value === "string") cols = colsAttr.value;
                        else if (typeof colsAttr?.value?.value === "string") cols = colsAttr.value.value;

                        const listItems = children.map((child: any) => ({
                            type: "listItem",
                            children: [{type: "paragraph", children: [child]}],
                        }));

                        const list = {
                            type: "list",
                            ordered: false,
                            children: [{type: "listItem", children: listItems}]
                        };

                        return {type: "containerDirective", name: "grid", attributes: {cols}, children: [list]} as any;
                    }

                    case "Card": {
                        const title = node.attributes?.find((a: any) => a.name === "title")?.value || "";
                        const href = node.attributes?.find((a: any) => a.name === "href")?.value || "";
                        const icon = node.attributes?.find((a: any) => a.name === "icon")?.value || "";
                        const iconType = node.attributes?.find((a: any) => a.name === "iconType")?.value || "";
                        const description = node.attributes?.find((a: any) => a.name === "description")?.value || "";
                        const imgSrc = node.attributes?.find((a: any) => a.name === "imgSrc")?.value || "";

                        const cardAttributes: any = {kind: "secondary"};
                        if (title) cardAttributes.title = title;
                        if (href) cardAttributes.href = href;
                        if (icon) cardAttributes.icon = icon;
                        if (iconType) cardAttributes.iconType = iconType;
                        if (description) cardAttributes.description = description;
                        if (imgSrc) cardAttributes.imgSrc = imgSrc;

                        return {type: "containerDirective", name: "guide-card", attributes: cardAttributes, children};
                    }

                    case "Frame": {
                        let pictureHtml = "<picture>\n";
                        if (node.children) {
                            for (const child of node.children) {
                                if (child.type === "mdxJsxFlowElement" && child.name === "img") {
                                    const imageData = this.convertLightDarkImage(child);
                                    if (!imageData) continue;
                                    pictureHtml += `  <img src="${imageData.src}" alt="${imageData.alt}" data-color-scheme="${imageData.colorScheme}" />\n`;
                                }
                            }
                        }
                        pictureHtml += "</picture>";
                        return {type: "html", value: pictureHtml};
                    }

                    case "Note":
                    case "Info":
                    case "Warning":
                    case "Tip":
                    case "Danger": {
                        let kind: string | undefined = undefined;
                        switch (componentName) {
                            case "Note":
                                kind = "note";
                                break;
                            case "Warning":
                                kind = "warning";
                                break;
                            case "Tip":
                                kind = "tip";
                                break;
                            case "Check":
                                kind = "check";
                                break;
                            case "Danger":
                                kind = "danger";
                                break;
                        }
                        return {
                            type: "containerDirective",
                            name: "callout",
                            attributes: {kind},
                            children: [{type: "paragraph", children}],
                        } as any;
                    }

                    case "Steps": {
                        return {
                            type: "containerDirective",
                            name: "steps",
                            attributes: {kind: "secondary"},
                            children: [{type: "list", ordered: true, start: 1, children}],
                        } as any;
                    }

                    case "Step": {
                        const stepTitle = node.attributes?.find((a: any) => a.name === "title")?.value || "";
                        const stepIcon = node.attributes?.find((a: any) => a.name === "icon")?.value || "";

                        const attrs: { name: string; value: string }[] = [];
                        if (stepIcon) attrs.push({name: "icon", value: stepIcon});
                        if (stepTitle) attrs.push({name: "title", value: stepTitle});

                        const listItemChildren: any[] = [];
                        if (attrs.length) listItemChildren.push({
                            type: "text",
                            value: `[${attrs.map((a) => `${a.name}="${a.value}"`).join(" ")}] `
                        });
                        listItemChildren.push(...children);

                        return {type: "listItem", children: [{type: "paragraph", children: listItemChildren}]};
                    }

                    case "Tabs": {
                        return {
                            type: "containerDirective",
                            name: "tabs",
                            attributes: {kind: "secondary"},
                            children: [{type: "list", ordered: true, start: 1, children}],
                        } as any;
                    }

                    case "Tab": {
                        const tabTitle = node.attributes?.find((a: any) => a.name === "title")?.value || "";
                        const parts: any[] = [];
                        if (tabTitle) {
                            const typeValue = String(tabTitle).toLowerCase();
                            parts.push({type: "text", value: `[${tabTitle}](type=${typeValue})`});
                            parts.push({type: "text", value: "\n"});
                        }
                        parts.push(...children);
                        return {type: "listItem", children: [{type: "paragraph", children: parts}]};
                    }

                    default: {
                        if ((includeMapping as any)[componentName]) {
                            return {
                                type: "paragraph",
                                children: [{type: "text", value: `@include "${includeMapping[componentName]}"`}]
                            };
                        }
                        return {type: "html", value: `<!-- ${componentName} NOT SUPPORTED YET -->`};
                    }
                }
            }

            node.children = processedChildren;
            return node;
        };

        const transformed = await transformNode(ast);
        return transformed || {type: "root", children: []};
    }

    // ---------------------------------------------------------------------------
    // Small utilities (ported from original helpers)
    // ---------------------------------------------------------------------------
    private hasNestedGroups(pages: any[]): boolean {
        for (const page of pages) {
            if (typeof page === "object" && (page as any).group) return true;
        }
        return false;
    }

    private isFlatStructure(pages: any[]): boolean {
        const prefixes = new Set<string>();
        let hasStringPages = false;
        let hasGroupPages = false;

        for (const page of pages) {
            if (typeof page === "string") {
                hasStringPages = true;
                const parts = page.split("/");
                if (parts.length > 1) prefixes.add(parts[0]);
            } else if (typeof page === "object" && (page as any).pages) {
                hasGroupPages = true;
                for (const nested of (page as any).pages) {
                    if (typeof nested === "string") {
                        const parts = nested.split("/");
                        if (parts.length > 1) prefixes.add(parts[0]);
                    }
                }
            }
        }

        return prefixes.size > 1 || (hasStringPages && hasGroupPages) || (prefixes.size === 1 && pages.some((p: any) => typeof p === "string" && !p.includes("/")));
    }

    private findFirstPage(pages: any[]): string | null {
        for (const page of pages) {
            if (typeof page === "string") return page;
            else if (typeof page === "object" && (page as any).pages) {
                const first = this.findFirstPage((page as any).pages);
                if (first) return first;
            }
        }
        return null;
    }

    private validateRoutePages(route: string, pages: any[]): boolean {
        if (!route) return true;

        const check = (page: any): boolean => {
            if (typeof page === "string") return page.startsWith(route + "/") || page === route;
            else if (typeof page === "object" && (page as any).pages) return (page as any).pages.every((nested: any) => check(nested));
            return false;
        };

        return pages.every(check);
    }
}
