import {join} from "node:path";
import {exec} from "node:child_process";
import {promisify} from "node:util";
import {readdir, readFile, rm, writeFile} from "node:fs/promises";

import {createProcessor} from "@mdx-js/mdx";
import {remark} from "remark";
import remarkDirective from "remark-directive";
import remarkStringify from "remark-stringify";

import {WebEditorHeader, Settings as XydSettings} from "@xyd-js/core";

import {AnchorsSchema, DropdownsSchema, GroupsSchema, MintlifyJSON, TabsSchema, VersionSchema} from "./types";

const execAsync = promisify(exec)

export async function isMintlify(docsPath: string, fileName: string) {
    if (fileName !== 'docs.json') {
        return false
    }

    console.log('Found docs.json file, checking if it\'s Mintlify...')

    const docsJsonPath = join(docsPath, fileName)
    const content = await readFile(docsJsonPath, 'utf-8')

    let data = null

    try {
        data = JSON.parse(content)
    } catch (e) {
    }

    if (isMintlifyJson(data)) {
        console.log('✅ Mintlify framework detected!')
        return true
    } else {
        console.log('❌ docs.json found but not a valid Mintlify configuration')
    }

    return false
}

export async function mintlifyMigrator(docsPath: string) {
    const docsJsonPath = join(docsPath, 'docs.json')
    const docsJson = JSON.parse(await readFile(docsJsonPath, 'utf-8')) as MintlifyJSON

    if (!docsJson) {
        console.error('Invalid Mintlify configuration: missing or incorrect.')
        return
    }

    const xydSettings: XydSettings = {
        theme: {
            name: "poetry",
            icons: {
                library: [
                    {
                        "name": "fa6-solid", // TODO: mintlify supports lucide icons too
                        "default": true
                    }
                ]
            },
            writer: {
                maxTocDepth: 4,
            }
        },
        navigation: {
            header: [],
            sidebar: []
        }
    }

    migrateNavigation(docsJson, xydSettings)

    // Convert theme colors if available
    if (docsJson.colors) {
        console.log("Migrating theme colors...")

        // Initialize styles object if it doesn't exist
        if (!xydSettings.theme!.appearance) {
            xydSettings.theme!.appearance = {}
        }

        xydSettings.theme!.appearance!.colors = {
            primary: docsJson.colors.primary,
            dark: docsJson.colors.dark,
            light: docsJson.colors.light,
        }
    }

    // Ensure public directory exists
    const publicDir = join(docsPath, 'public')
    try {
        await readdir(publicDir)
    } catch {
        console.log("Creating public directory...")
        await execAsync(`mkdir -p "${publicDir}"`)
    }

    // Helper function to move resource to public folder
    async function moveResourceToPublic(resourcePath: string | undefined): Promise<string> {
        if (!resourcePath) return ''

        // Remove leading slash if present
        const cleanPath = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath

        // If already in public folder, return as is
        if (cleanPath.startsWith('public/')) {
            return `/${cleanPath}`
        }

        const sourcePath = join(docsPath, cleanPath)

        try {
            // Check if source file exists
            await readFile(sourcePath)

            // Create the same directory structure in public
            const relativePath = cleanPath
            const destPath = join(publicDir, relativePath)

            // Ensure the destination directory exists
            const destDir = destPath.substring(0, destPath.lastIndexOf('/'))
            try {
                await readdir(destDir)
            } catch {
                await execAsync(`mkdir -p "${destDir}"`)
            }

            // Move file to public directory preserving structure
            await execAsync(`mv "${sourcePath}" "${destPath}"`)
            console.log(`Moved resource: ${cleanPath} -> public/${relativePath}`)

            return `/public/${relativePath}`
        } catch (error) {
            console.log(`Resource not found or already in public: ${cleanPath}`)
            return resourcePath
        }
    }

    // Convert logo if available
    if (docsJson.logo) {
        console.log("Migrating logo...")

        if (typeof docsJson.logo === 'string') {
            xydSettings.theme!.logo = await moveResourceToPublic(docsJson.logo)
        } else if (typeof docsJson.logo === 'object') {
            xydSettings.theme!.logo = {
                light: await moveResourceToPublic(docsJson.logo.light),
                dark: await moveResourceToPublic(docsJson.logo.dark),
                href: docsJson.logo.href
            }
        }
    }

    // Convert favicon if available
    if (docsJson.favicon) {
        console.log("Migrating favicon...")

        if (typeof docsJson.favicon === 'string') {
            xydSettings.theme!.favicon = await moveResourceToPublic(docsJson.favicon)
        } else if (typeof docsJson.favicon === 'object') {
            // Use light favicon as default, fallback to dark
            const lightFavicon = await moveResourceToPublic(docsJson.favicon.light)
            const darkFavicon = await moveResourceToPublic(docsJson.favicon.dark)
            xydSettings.theme!.favicon = lightFavicon || darkFavicon
        }
    }

    // Scan and move all image resources to public folder
    console.log("Scanning for image resources...")
    await scanAndMoveImageResources(docsPath, publicDir)

    // Convert navbar links to header if available
    if (docsJson.navbar?.links) {
        console.log("Migrating navbar links...")

        xydSettings.webeditor!.header = docsJson.navbar.links.map(link => ({
            title: link.label,
            href: link.href,
            icon: typeof link.icon === 'string' ? link.icon : link.icon?.name,
            float: 'right'
        }))
    }

    // Convert footer if available
    if (docsJson.footer) {
        console.log("Migrating footer...")

        // Convert Mintlify socials to XYD format (only include supported platforms)
        const xydSocials: any = {}
        if (docsJson.footer.socials) {
            const supportedPlatforms = ['x', 'facebook', 'youtube', 'discord', 'slack', 'github', 'linkedin', 'instagram', 'hackernews', 'medium', 'telegram', 'bluesky', 'reddit']
            for (const [platform, url] of Object.entries(docsJson.footer.socials)) {
                if (supportedPlatforms.includes(platform)) {
                    xydSocials[platform] = url
                }
            }
        }

        xydSettings.webeditor!.footer = {
            social: Object.keys(xydSocials).length > 0 ? xydSocials : undefined,
            links: docsJson.footer.links?.map(linkGroup => ({
                header: linkGroup.header || '',
                items: linkGroup.items.map(item => ({
                    label: item.label,
                    href: item.href
                }))
            }))
        }
    }

    // Convert redirects if available
    if (docsJson.redirects) {
        console.log("Migrating redirects...")

        xydSettings.redirects = docsJson.redirects.map(redirect => ({
            source: redirect.source,
            destination: redirect.destination
        }))
    }

    // Convert SEO settings if available
    if (docsJson.seo) {
        console.log("Migrating SEO...")

        xydSettings.seo = {
            metatags: docsJson.seo.metatags || undefined
        }
    }

    await writeFile(join(docsPath, 'docs.json'), JSON.stringify(xydSettings, null, 2))

    // Migrate content files
    await migrateContent(docsPath)

    console.log('✅ Mintlify migration completed!')
}

// TODO: in the future more advanced structuring - currently a basic header pushing migration + sidebar
function migrateNavigation(
    docsJson: MintlifyJSON,
    xydSettings: XydSettings
) {
    function migrateNav(navs: GroupsSchema | TabsSchema | DropdownsSchema | AnchorsSchema | VersionSchema[]) {
        for (const nav of navs) {
            // Check if this anchor has groups (navigation structure) or is just an external link
            const hasGroups = 'groups' in nav && nav.groups
            const hasHref = 'href' in nav && nav.href

            let title = ""
            if ("group" in nav) {
                title = nav.group
            } else if ("tab" in nav) {
                title = nav.tab
            } else if ("dropdown" in nav) {
                title = nav.dropdown
            } else if ("anchor" in nav) {
                title = nav.anchor
            }

            // Create header navigation entry
            const headerEntry: WebEditorHeader = {
                title: title,
                icon: "icon" in nav ? typeof nav.icon === 'string' ? nav.icon : nav.icon?.name : ""
            }

            if (hasHref && !hasGroups) {
                // External link - use href
                headerEntry.href = nav.href
                headerEntry.float = 'right'
                console.log(`Created external header link: ${title} -> ${nav.href}`)
            } else if (hasGroups) {
                // Internal navigation - create page route
                const route = title.toLowerCase().replace(/\s+/g, '-')
                headerEntry.page = route
                console.log(`Created internal header page: ${title} -> ${route}`)

                // Convert groups to sidebar pages
                const sidebarPages: any[] = []

                // TODO: support pages only?
                if ("groups" in nav) {
                    for (const group of nav.groups as GroupsSchema) {
                        // Check if group has pages (navigation structure) or is API-related
                        const hasPages = 'pages' in group && group.pages

                        if (hasPages) {
                            const sidebarGroup = {
                                group: group.group,
                                icon: typeof group.icon === 'string' ? group.icon : group.icon?.name,
                                pages: convertPagesToXYD(group.pages)
                            }
                            sidebarPages.push(sidebarGroup)
                        } else {
                            console.log(`Skipping API group: ${group.group} (no pages property)`)
                        }
                    }
                }

                // Create sidebar route
                const sidebarRoute = {
                    route: route,
                    pages: sidebarPages
                }

                xydSettings.navigation!.sidebar!.push(sidebarRoute)
                console.log(`Created sidebar route: ${route} for anchor: ${title}`)
            }

            xydSettings.webeditor!.header!.push(headerEntry)
        }
    }

    if ("groups" in docsJson.navigation) {
        console.log("Migrating groups...")
        migrateNav(docsJson.navigation.groups)
    }

    if ("tabs" in docsJson.navigation) {
        console.log("Migrating links...")
        migrateNav(docsJson.navigation.tabs)
    }

    if ("anchors" in docsJson.navigation) {
        console.log("Migrating anchors...")
        migrateNav(docsJson.navigation.anchors)
    }

    if ("dropdowns" in docsJson.navigation) {
        console.log("Migrating dropdowns...")
        migrateNav(docsJson.navigation.dropdowns)
    }

    if ("versions" in docsJson.navigation) {
        // Add version support note with colors
        console.log('\n\x1b[33m⚠️  Note: Version navigation is not currently supported\x1b[0m')
        console.log('\x1b[33m   Only the first version navigation will be created\x1b[0m')
        console.log('\x1b[36m   📋 Roadmap: https://github.com/orgs/livesession/projects/4\x1b[0m\n')

        if (docsJson.navigation?.versions?.length) {
            const firstVersion = docsJson.navigation.versions[0]

            if ("groups" in firstVersion && firstVersion.groups) {
                console.log("Migrating first version...")

                migrateNav([firstVersion])
            }
        }
    }
}

/**
 * Convert Mintlify pages array to XYD pages format
 */
function convertPagesToXYD(pages: any[]): any[] {
    const convertedPages: any[] = []

    for (const page of pages) {
        if (typeof page === 'string') {
            // Simple string page
            convertedPages.push(page)
        } else if (typeof page === 'object' && page.group) {
            // Nested group
            const nestedGroup = {
                group: page.group,
                pages: convertPagesToXYD(page.pages || [])
            }
            convertedPages.push(nestedGroup)
        }
    }

    return convertedPages
}

async function scanAndMoveImageResources(docsPath: string, publicDir: string) {
    const imageExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico']

    async function scanDirectory(currentDir: string) {
        const items = await readdir(currentDir, {withFileTypes: true})

        for (const item of items) {
            const fullPath = join(currentDir, item.name)

            if (item.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', 'public'].includes(item.name)) {
                    await scanDirectory(fullPath)
                }
            } else if (item.isFile()) {
                const ext = item.name.toLowerCase().substring(item.name.lastIndexOf('.'))
                if (imageExtensions.includes(ext)) {
                    try {
                        // Calculate relative path from docsPath to maintain structure
                        const relativePath = fullPath.replace(docsPath, '').replace(/^\/+/, '')
                        const destPath = join(publicDir, relativePath)

                        // Ensure the destination directory exists
                        const destDir = destPath.substring(0, destPath.lastIndexOf('/'))
                        try {
                            await readdir(destDir)
                        } catch {
                            await execAsync(`mkdir -p "${destDir}"`)
                        }

                        // Check if file already exists in public
                        try {
                            await readFile(destPath)
                            console.log(`Image already exists in public: ${relativePath}`)
                        } catch {
                            // Move file to public directory preserving structure
                            await execAsync(`mv "${fullPath}" "${destPath}"`)
                            console.log(`Moved image: ${fullPath} -> public/${relativePath}`)
                        }
                    } catch (error) {
                        console.log(`Error moving image ${item.name}:`, error)
                    }
                }
            }
        }
    }

    await scanDirectory(docsPath)
}

async function migrateContent(docsPath: string) {
    console.log("Migrating content files...")

    // Find all .mdx files recursively
    const mdxFiles = await findMdxFiles(docsPath)
    console.log(`Found ${mdxFiles.length} MDX files to migrate`)

    for (const mdxFile of mdxFiles) {
        await migrateMdxFile(docsPath, mdxFile)
    }

    console.log("✅ Content migration completed!")
}

async function findMdxFiles(dir: string): Promise<string[]> {
    const files: string[] = []

    async function scanDirectory(currentDir: string) {
        const items = await readdir(currentDir, {withFileTypes: true})

        for (const item of items) {
            const fullPath = join(currentDir, item.name)

            if (item.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
                    await scanDirectory(fullPath)
                }
            } else if (item.isFile() && item.name.endsWith('.mdx')) {
                files.push(fullPath)
            }
        }
    }

    await scanDirectory(dir)
    return files
}

async function migrateMdxFile(docsPath: string, filePath: string) {
    try {
        // console.log(`Migrating: ${filePath}`)

        // Read the MDX file
        const content = await readFile(filePath, 'utf-8')

        // Convert Mintlify components to XYD format
        const convertedContent = await convertMintlifyComponents(docsPath, content, filePath)

        // Create new file path with .md extension
        const newFilePath = filePath.replace(/\.mdx$/, '.md')

        // Write the converted content
        await writeFile(newFilePath, convertedContent)

        // Remove the original .mdx file
        await rm(filePath)

        // console.log(`✅ Converted: ${filePath} -> ${newFilePath}`)
    } catch (error) {
        console.error(`❌ Error migrating ${filePath}:`, error)
    }
}

async function convertMintlifyComponents(docsPath: string, content: string, filePath: string): Promise<string> {
    try {
        console.log('Processing MDX content...', filePath)

        // Check if content has frontmatter
        const hasFrontmatter = content.startsWith('---')
        let frontmatter = ''
        let bodyContent = content

        if (hasFrontmatter) {
            const frontmatterEnd = content.indexOf('---', 3)
            if (frontmatterEnd !== -1) {
                frontmatter = content.substring(0, frontmatterEnd + 3)
                bodyContent = content.substring(frontmatterEnd + 3)
            }
        }

        // Create MDX processor with options to prevent entity encoding
        const processor = createProcessor({
            jsx: true,
            development: false
        })

        // Parse MDX to AST
        const ast = await processor.parse(bodyContent)

        // Store original MDX string for comment generation
        const originalMdxString = bodyContent

        // Extract title and description from frontmatter
        let title = ''
        let description = ''
        if (hasFrontmatter) {
            const frontmatterContent = frontmatter.replace(/^---\n/, '').replace(/\n---$/, '')
            const lines = frontmatterContent.split('\n')
            for (const line of lines) {
                if (line.startsWith('title:')) {
                    title = line.replace('title:', '').trim()
                } else if (line.startsWith('description:')) {
                    description = line.replace('description:', '').trim()
                }
            }
        }

        // Transform Mintlify components to XYD format
        await transformMintlifyComponents(ast, originalMdxString)

        // Add title and description at the top of the AST
        if (title || description) {
            const titleAndDescriptionNodes: any[] = []

            if (title) {
                titleAndDescriptionNodes.push({
                    type: 'heading',
                    depth: 1,
                    children: [{type: 'text', value: title}]
                })
            }

            if (description) {
                titleAndDescriptionNodes.push({
                    type: 'containerDirective',
                    name: 'subtitle',
                    children: [{type: 'text', value: description}]
                })
            }

            // Insert at the beginning of the AST
            ast.children = [...titleAndDescriptionNodes, ...ast.children]
        }

        try {
            // Convert AST back to markdown string
            const markdown = remark()
                .use(remarkDirective)
                .use(remarkStringify, {
                    bullet: '-',
                    fences: true,
                    listItemIndent: 'one',
                    incrementListMarker: true,
                    quote: '"',
                    emphasis: '*',
                    strong: '*',
                    tightDefinitions: true,
                })
                .stringify(ast)
                .replace(/&#x20;/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")

                .replace(/\\\[/g, '[')
                .replace(/\\\]/g, ']')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')

            // Combine frontmatter with transformed content
            const result = frontmatter + '\n\n' + markdown

            return result
        } catch (e) {
            await writeFile(join(docsPath, 'ast.json'), JSON.stringify(ast, null, 2))

            console.error("Error converting MDX to markdown", filePath)
            throw e
        }
    } catch (error) {
        console.error('Error processing MDX:', error)
        // Fallback to original content if processing fails
        return content
    }
}

// Shared function to convert Mintlify light/dark mode images to XYD format
function convertLightDarkImage(node: any): { colorScheme: string; src: string; alt: string } | null {
    const className = node.attributes?.find((attr: any) => attr.name === 'className')?.value || ''
    let src = node.attributes?.find((attr: any) => attr.name === 'src')?.value || ''
    const alt = node.attributes?.find((attr: any) => attr.name === 'alt')?.value || ''

    // Check if it has light/dark mode classes
    if (className.includes('dark:hidden') || className.includes('dark:block')) {
        // Determine color scheme based on className
        let colorScheme = ''
        if (className.includes('dark:hidden')) {
            colorScheme = 'light'
        } else if (className.includes('dark:block')) {
            colorScheme = 'dark'
        }

        // Convert relative paths to public paths (but not absolute URLs)
        if (src.startsWith('/') && !src.startsWith('/public/') && !src.startsWith('http://') && !src.startsWith('https://')) {
            src = `/public${src}`
        }

        return {colorScheme, src, alt}
    }

    return null
}

async function transformMintlifyComponents(ast: any, originalMdxString: string): Promise<any> {
    // Track include mappings globally
    const includeMapping: Record<string, string> = {}

    // Use a recursive approach to handle nested structures properly
    async function transformNode(node: any): Promise<any> {
        if (!node) {
            return null
        }

        // Process children first (bottom-up)
        const processedChildren = []
        if (node.children) {
            for (const child of node.children) {
                const processedChild = await transformNode(child)
                if (processedChild) {
                    // Handle case where transformNode returns multiple nodes
                    if (Array.isArray(processedChild)) {
                        processedChildren.push(...processedChild)
                    } else {
                        processedChildren.push(processedChild)
                    }
                }
            }
        }

        // Decode HTML entities in text nodes
        if (node.type === 'text' && node.value) {
            node.value = node.value
                .replace(/&#x20;/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
        }

        if (node.type === "mdxjsEsm") {
            // Parse the import statement from the node
            const importStatement = node.value || ''

            // Extract the import path using regex
            const importMatch = importStatement.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/)

            if (importMatch) {
                const [, componentName, importPath] = importMatch

                // Convert the import path to XYD format
                let xydPath = importPath

                // If it's a local path (starts with './' or '/'), convert to XYD format
                if (importPath.startsWith('./') || importPath.startsWith('/')) {
                    // Remove leading slash if present and convert to XYD format
                    xydPath = importPath.replace(/^\.?\//, '~/')

                    // Change .mdx extension to .md for XYD
                    xydPath = xydPath.replace(/\.mdx$/, '.md')
                }

                console.log("importMappings", componentName, xydPath)

                // Store the import mapping globally for later use when processing component usage
                includeMapping[componentName] = xydPath

                // Return null to remove the import statement from the output
                return null
            }

            // If we can't parse the import, return a comment
            return {
                type: 'html',
                value: `<!-- Import statement not supported: ${importStatement} -->`
            }
        }

        if (
            node.type === 'mdxJsxFlowElement' ||
            node.type === 'mdxJsxTextElement' ||
            node.type === 'mdxFlowExpression'
        ) {
            const componentName = node.name
            const children = processedChildren

            // Convert Mintlify to XYD components
            switch (componentName) {
                case 'img': {
                    const imageData = convertLightDarkImage(node)
                    if (imageData) {
                        return {
                            type: 'html',
                            value: `<img src="${imageData.src}" alt="${imageData.alt}" data-color-scheme="${imageData.colorScheme}" />`
                        }
                    }
                }
                case 'Columns':
                case 'CardGroup':
                    // Convert Mintlify Columns/CardGroup to XYD grid directive with list structure
                    const colsAttr = node.attributes?.find((attr: any) => attr.name === 'cols')
                    let cols = '2'

                    if (typeof colsAttr?.value === "string") {
                        cols = colsAttr.value
                    } else if (typeof colsAttr?.value?.value === "string") {
                        cols = colsAttr.value.value
                    }

                    // Create list items for each child (Card)
                    const listItems = children.map((child: any) => ({
                        type: 'listItem',
                        children: [{
                            type: 'paragraph',
                            children: [child]
                        }]
                    }))

                    // Create list structure
                    const list = {
                        type: 'list',
                        ordered: false,
                        children: [
                            {
                                type: 'listItem',
                                children: listItems
                            }
                        ]
                    }

                    // Create the grid directive wrapper with list as children
                    const gridDirective = {
                        type: 'containerDirective',
                        name: 'grid',
                        attributes: {
                            cols: cols
                        },
                        children: [list]
                    }

                    return gridDirective
                case 'Card':
                    // Convert Mintlify Card to XYD guide-card directive
                    const title = node.attributes?.find((attr: any) => attr.name === 'title')?.value || ''
                    const href = node.attributes?.find((attr: any) => attr.name === 'href')?.value || ''
                    const icon = node.attributes?.find((attr: any) => attr.name === 'icon')?.value || ''
                    const iconType = node.attributes?.find((attr: any) => attr.name === 'iconType')?.value || ''
                    const description = node.attributes?.find((attr: any) => attr.name === 'description')?.value || ''
                    const imgSrc = node.attributes?.find((attr: any) => attr.name === 'imgSrc')?.value || ''

                    // Build attributes for the guide-card directive
                    const cardAttributes: any = {
                        kind: 'secondary'
                    }
                    if (title) cardAttributes.title = title
                    if (href) cardAttributes.href = href
                    if (icon) cardAttributes.icon = icon
                    if (iconType) cardAttributes.iconType = iconType
                    if (description) cardAttributes.description = description
                    if (imgSrc) cardAttributes.imgSrc = imgSrc

                    return {
                        type: 'containerDirective',
                        name: 'guide-card',
                        attributes: cardAttributes,
                        children: children
                    }
                case 'Frame':
                    // Convert Frame component to XYD picture format with data-color-scheme
                    // Frame contains light and dark mode images with Tailwind classes
                    let pictureHtml = '<picture>\n'

                    // Process the original children of the Frame component, not the processed ones
                    if (node.children) {
                        for (const child of node.children) {
                            if (child.type === 'mdxJsxFlowElement' && child.name === 'img') {
                                const imageData = convertLightDarkImage(child)
                                if (!imageData) {
                                    continue
                                }

                                pictureHtml += `  <img src="${imageData.src}" alt="${imageData.alt}" data-color-scheme="${imageData.colorScheme}" />\n`
                            }
                        }
                    }

                    pictureHtml += '</picture>'

                    return {
                        type: 'html',
                        value: pictureHtml
                    }
                case 'Note':
                case 'Info':
                case 'Warning':
                case 'Tip':
                case 'Danger':
                    let kind = undefined

                    switch (componentName) {
                        case 'Note':
                            kind = 'note'
                            break
                        case 'Warning':
                            kind = 'warning'
                            break
                        case 'Tip':
                            kind = 'tip'
                            break
                        case 'Check':
                            kind = 'check'
                            break
                        case 'Danger':
                            kind = 'danger'
                            break
                    }

                    // Create a new callout directive node with compact formatting
                    // Wrap all children in a single paragraph to prevent extra line breaks
                    return {
                        type: 'containerDirective',
                        name: 'callout',
                        attributes: {
                            kind
                        },
                        children: [{
                            type: 'paragraph',
                            children: children
                        }]
                    }
                case 'Steps':
                    // Convert Steps component to XYD steps directive
                    // Each child should be a Step component that we'll convert to numbered list items
                    return {
                        type: 'containerDirective',
                        name: 'steps',
                        attributes: {
                            kind: "secondary"
                        },
                        children: [{
                            type: 'list',
                            ordered: true,
                            start: 1,
                            children: children
                        }]
                    }

                case 'Step':
                    // Convert Step component to a list item with title and content
                    const stepTitle = node.attributes?.find((attr: any) => attr.name === 'title')?.value || ''
                    const stepIcon = node.attributes?.find((attr: any) => attr.name === 'icon')?.value || ''
                    // const stepIconType = node.attributes?.find((attr: any) => attr.name === 'iconType')?.value || '' // TODO: maybe in the future

                    const attributes = []

                    // Build attributes for the list item
                    if (stepIcon) {
                        attributes.push({
                            name: 'icon',
                            value: stepIcon
                        })
                    }
                    if (stepTitle) {
                        attributes.push({
                            name: 'title',
                            value: stepTitle
                        })
                    }

                    // Create a list item with attributes as text and content
                    const listItemChildren = []

                    // Add attributes as text if they exist
                    if (attributes.length > 0) {
                        const attributeText = attributes.map(attr => `${attr.name}="${attr.value}"`).join(' ')
                        listItemChildren.push({
                            type: 'text',
                            value: `[${attributeText}] `
                        })
                    }

                    // Add the content
                    listItemChildren.push(...children)

                    return {
                        type: 'listItem',
                        children: [{
                            type: 'paragraph',
                            children: listItemChildren
                        }]
                    }
                case 'Tabs':
                    // Convert Tabs component to XYD tabs directive
                    // Each child should be a Tab component that we'll convert to numbered list items
                    return {
                        type: 'containerDirective',
                        name: 'tabs',
                        attributes: {
                            kind: "secondary"
                        },
                        children: [{
                            type: 'list',
                            ordered: true,
                            start: 1,
                            children: children
                        }]
                    }
                case 'Tab':
                    // Convert Tab component to a list item with title and content
                    const tabTitle = node.attributes?.find((attr: any) => attr.name === 'title')?.value || ''

                    // Create a list item with title as link format
                    const tabListItemChildren = []

                    // Add title as link format if it exists
                    if (tabTitle) {
                        // Convert title to lowercase for type attribute
                        const typeValue = tabTitle.toLowerCase()
                        tabListItemChildren.push({
                            type: 'text',
                            value: `[${tabTitle}](type=${typeValue})`
                        })
                        // Add a line break after the title
                        tabListItemChildren.push({
                            type: 'text',
                            value: '\n'
                        })
                    }

                    // Add the content
                    tabListItemChildren.push(...children)

                    return {
                        type: 'listItem',
                        children: [{
                            type: 'paragraph',
                            children: tabListItemChildren
                        }]
                    }
                default:
                    // // Check if this is an imported component
                    if (includeMapping[componentName]) {
                        // Convert imported component usage to @import directive
                        return {
                            type: 'paragraph',
                            children: [
                                {
                                    type: 'text',
                                    value: `@include "${includeMapping[componentName]}"`
                                }
                            ]
                        }
                    }

                    // If not an imported component, return unsupported comment
                    return {
                        type: 'html',
                        value: `<!-- ${componentName} NOT SUPPORTED YET -->`
                    }
            }
        }

        // For all other nodes, update their children and return the node
        node.children = processedChildren
        return node
    }

    // Transform the entire AST
    const transformedAst = await transformNode(ast)
    return transformedAst || {type: 'root', children: []}
}

function isMintlifyJson(data: any): boolean {
    // Check if data is an object and has the required $schema property
    if (!data || typeof data !== 'object' || !data.$schema) {
        return false
    }

    // Check if $schema points to the correct Mintlify schema URL
    const schemaUrl = data.$schema
    return schemaUrl === 'https://mintlify.com/docs.json'
}
