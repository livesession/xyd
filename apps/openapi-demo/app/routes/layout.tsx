import React, { useState, useRef, createContext, useContext, useEffect, useMemo } from 'react';
import {
    Outlet,
    useFetcher,
    useLocation,
    useNavigate,
    useNavigation,
} from "react-router";
import { Box, Button, Dropdown, Flex, TextField, Text } from 'gestalt';
import GitHubButton from 'react-github-btn'

import { Badge } from "@xyd-js/components/writer"
import { ReactContent } from "@xyd-js/components/content";
import { Atlas, AtlasContext, type VariantToggleConfig } from "@xyd-js/atlas";
import { Surfaces, Framework, FwLink } from "@xyd-js/framework/react";
import ThemePoetry from "@xyd-js/theme-poetry";
import ThemeOpener from "@xyd-js/theme-opener";
import ThemeCosmo from "@xyd-js/theme-cosmo";

import { SETTINGS } from './settings';
import { useGlobalState } from '../context';

// Dynamically import theme CSS based on settings
if (SETTINGS?.theme?.name === "poetry") {
    import("@xyd-js/theme-poetry/index.css");
} else if (SETTINGS?.theme?.name === "opener") {
    import("@xyd-js/theme-opener/index.css");
} else if (SETTINGS?.theme?.name === "cosmo") {
    import("@xyd-js/theme-cosmo/index.css");
}
import 'gestalt/dist/gestalt.css';
import "../index.css";
import { DOCS_PREFIX } from '~/const';
import { UrlContext } from '~/context';

const surfaces = new Surfaces()
function SidebarItemRight(props: any) {
    const openapi = props?.pageMeta?.openapi || ""
    const [_, region = ""] = openapi.includes("#") ? openapi.split("#") : ["", openapi]
    const [method = ""] = region.split(" ")

    if (!method) {
        return null
    }
    let methodText = method.toUpperCase()
    if (method === "DELETE") {
        methodText = "DEL"
    }
    []
    return <div data-active={props?.active ? "true" : undefined} atlas-oas-method={method}>
        <Badge size="xs">
            {methodText}
        </Badge>
    </div>
}

surfaces.define("sidebar.item.right", SidebarItemRight);

const reactContent = new ReactContent(SETTINGS, {
    Link: FwLink,
    components: {
        Atlas,
    },
    useLocation, // // TODO: !!!! BETTER API !!!!!
    useNavigate,
    useNavigation
})
// TODO: !!! for demo it cannot be globalThis cuz its globally for whole server !!!
globalThis.__xydThemeSettings = SETTINGS?.theme
globalThis.__xydReactContent = reactContent
globalThis.__xydSurfaces = surfaces

let theme: any | null = null

switch (SETTINGS?.theme?.name) {
    case "poetry":
        theme = new ThemePoetry()
        break
    case "opener":
        theme = new ThemeOpener()
        break
    case "cosmo":
        theme = new ThemeCosmo()
        break
    default:
        theme = null
}

export const DemoContext = createContext({})

export default function Layout() {
    const [example, setExample] = useState(null);
    const { actionData: globalActionData } = useGlobalState();

    const effectiveActionData = globalActionData || null

    if (!effectiveActionData) {
        return null
    }

    let currentTheme = null;
    const settings = Object.keys(effectiveActionData.settings).length ? effectiveActionData.settings : SETTINGS

    switch (settings?.theme?.name) {
        case "poetry":
            currentTheme = new ThemePoetry();
            break;
        case "opener":
            currentTheme = new ThemeOpener();
            break;
        case "cosmo":
            currentTheme = new ThemeCosmo();
            break;
        default:
            currentTheme = null;
    }

    const {
        Page: BaseThemePage,
        Layout: BaseThemeLayout,
    } = currentTheme || {};

    return (
        <DemoContext.Provider value={{ example, setExample, settings}}>
            <Layout2 effectiveActionData={effectiveActionData} BaseThemePage={BaseThemePage} BaseThemeLayout={BaseThemeLayout} />
        </DemoContext.Provider>
    );
}

const Layout2 = React.memo(function Layout2({
    effectiveActionData,
    BaseThemeLayout,
    BaseThemePage
}: {
    effectiveActionData: any;
    BaseThemeLayout: any;
    BaseThemePage: any;
}) {
    console.log("effectiveActionData", effectiveActionData)
    // Get current theme based on settings

    let atlasVariantToggles: VariantToggleConfig[] = [];
    if (effectiveActionData.exampleType === "openapi") {
        atlasVariantToggles = [
            { key: "status", defaultValue: "200" },
            { key: "contentType", defaultValue: "application/json" }
        ];
    } else {
        atlasVariantToggles = [
            { key: "symbolName", defaultValue: "" }
        ];
    }
    return <Framework
        settings={effectiveActionData.settings || {}}
        sidebarGroups={effectiveActionData.groups || []}
        metadata={{
            layout: "wide",
            uniform: "1",
            title: "OpenAPI Demo"
        }}
        surfaces={surfaces}
        BannerComponent={MemoizedActionDropdownExample}
    >
        <AtlasContext
            value={{
                syntaxHighlight: effectiveActionData.settings?.theme?.markdown?.syntaxHighlight || null,
                baseMatch: "/docs/api",
                variantToggles: atlasVariantToggles
            }}
        >
            {BaseThemeLayout && (
                <BaseThemeLayout>
                    <UrlContext.Provider value={{ BaseThemePage }}>
                        <Outlet />
                    </UrlContext.Provider>
                </BaseThemeLayout>
            )}
        </AtlasContext>
    </Framework>
});

function MemoizedActionDropdownExample() {
    const { settings: globalSettings } = useContext(DemoContext)
    return <ActionDropdownExample settings={globalSettings} />
}

function ActionDropdownExample({ settings }: { settings: any }) {
    const fetcher = useFetcher();
    const { example } = useContext(DemoContext)
    const { setActionData } = useGlobalState();
    const navigate = useNavigate()

    useEffect(() => {
        if (fetcher.data) {
            setActionData(fetcher.data)
            let canonical = fetcher?.data?.references?.[0]?.canonical
            if (canonical) {
                canonical = canonical.startsWith("/") ? canonical : `/${canonical}`
                if (canonical.endsWith("/")) {
                    canonical = canonical.slice(0, -1)
                }

                navigate(`${DOCS_PREFIX}${canonical}`)
            }
        }
    }, [fetcher])

    return (
        <div className="banner-container">
            <div className="banner-left">
                <GithubStars settings={settings} />
            </div>

            <fetcher.Form method="POST" action="/api/try">
                <input type="hidden" name="type" value={example?.type} />
                <input type="hidden" name="value" value={example?.value} />
                <Flex alignItems="center" gap={2}>
                    <UniformURLInput />

                    <Flex>
                        <Button type="submit" size="sm" text="Try!" />
                    </Flex>

                    <Flex width="100%">
                        <SelectPredefinedUniformURL />
                    </Flex>
                    {/* TODO: in the futures */}
                    {/* <Flex width="100%">
                        <SelectTheme />
                    </Flex> */}
                </Flex>
            </fetcher.Form>
            <div className="banner-right">
                Right
            </div>
        </div>
    );
}

function GithubStars({ settings }: { settings: any }) {
    return <>
        {
            settings?.integrations?.apps?.githubStar && <>
                <Text weight="bold">
                    Star us on GitHub ⭐️
                </Text>

                <GitHubButton
                    href={settings?.integrations?.apps?.githubStar?.href}
                    data-icon={settings?.integrations?.apps?.githubStar?.dataIcon || "octicon-star"}
                    data-size={settings?.integrations?.apps?.githubStar?.dataSize || "large"}
                    data-show-count={settings?.integrations?.apps?.githubStar?.dataShowCount || true}
                    aria-label={settings?.integrations?.apps?.githubStar?.ariaLabel}
                >
                    {settings?.integrations?.apps?.githubStar?.title}
                </GitHubButton>
            </>
        }
    </>
}
function SelectPredefinedUniformURL() {
    const { setExample } = useContext(DemoContext)

    const exmaples = {
        openai: {
            value: "openai",
            url: "https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/master/openapi.yaml",
            label: "OpenAI",
            type: "openapi"
        },
        monday: {
            value: "monday",
            url: "https://api.monday.com/v2/get_schema?format=sdl",
            label: "Monday.com",
            type: "graphql"
        }
    }

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const anchorRef = useRef(null);

    const onSelect = ({ item }) => {
        setSelected(item)
        setOpen(false)

        const example = exmaples[item?.value]
        if (!example) return

        setExample(example)
    };

    return <>
        <Button
            ref={anchorRef}
            accessibilityControls="choose-example"
            accessibilityExpanded={open}
            accessibilityHaspopup
            iconEnd="arrow-down"
            onClick={() => setOpen((prevVal) => !prevVal)}
            selected={open}
            size="sm"
            text={'Pick Example'}
        />
        {open && (
            <Dropdown
                anchor={anchorRef.current}
                id="choose-example"
                onDismiss={() => setOpen(false)}
            >

                {Object.values(exmaples).map((example) => (
                    <Dropdown.Item
                        onSelect={onSelect}
                        option={{ value: example.value, label: example.label }}
                        selected={selected}
                        badge={{
                            text: example.type === "openapi" ? "OpenAPI" : "GraphQL",
                            type: example.type === "openapi" ? "success" : "recommendation"
                        }}
                    />
                ))}
            </Dropdown>
        )}
    </>
}

function SelectTheme() {
    const themes = [
        {
            value: "poetry",
            label: "Poetry",
        },
        {
            value: "opener",
            label: "Opener",
        },
        {
            value: "cosmo",
            label: "Cosmo",
        },
        {
            value: "picasso",
            label: "Picasso",
        },
    ]
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const anchorRef = useRef(null);
    const { setActionData } = useGlobalState();

    const onSelect = ({ item }) => {
        console.log("on")
        setSelected(item);
        setOpen(false);

        // Update theme in settings
        const newSettings = JSON.parse(JSON.stringify(SETTINGS));
        newSettings.theme = {
            ...newSettings.theme,
            name: item.value
        };

        // Update global theme settings
        globalThis.__xydThemeSettings = newSettings.theme;

        // Update theme instance
        let newTheme = null;
        switch (item.value) {
            case "poetry":
                newTheme = new ThemePoetry();
                break;
            case "opener":
                newTheme = new ThemeOpener();
                break;
            case "cosmo":
                newTheme = new ThemeCosmo();
                break;
            default:
                newTheme = null;
        }

        // Update global state to trigger re-render with new theme
        setActionData(prev => ({
            ...prev,
            settings: newSettings
        }));

        // Dynamically import theme CSS
        const themeName = item.value;

        // Remove old theme styles - both Vite dev mode and regular link tags
        const oldThemeStyles = document.querySelectorAll('link[data-theme-style], style[data-vite-dev-id*="theme-"]');
        oldThemeStyles.forEach(style => style.remove());

        // Create new theme style link
        const themeStyles = document.createElement('link');
        themeStyles.rel = 'stylesheet';
        themeStyles.href = `/node_modules/@xyd-js/theme-${themeName}/dist/index.css`;
        themeStyles.setAttribute('data-theme-style', 'true');
        document.head.appendChild(themeStyles);
    };

    return <>
        <Button
            ref={anchorRef}
            accessibilityControls="choose-theme"
            accessibilityExpanded={open}
            accessibilityHaspopup
            iconEnd="arrow-down"
            onClick={() => setOpen((prevVal) => !prevVal)}
            selected={open}
            size="sm"
            text={selected ? selected.label : 'Pick Theme'}
        />
        {
            open && (
                <Dropdown
                    anchor={anchorRef.current}
                    id="choose-theme"
                    onDismiss={() => setOpen(false)}
                >
                    {themes.map((theme) => (
                        <Dropdown.Item
                            key={theme.value}
                            onSelect={onSelect}
                            option={{ value: theme.value, label: theme.label }}
                            selected={selected}
                        />
                    ))}
                </Dropdown>
            )
        }
    </>
}

function UniformURLInput() {
    const { example } = useContext(DemoContext)
    const [input, setInput] = useState(example?.url);

    return (
        <Flex
            alignItems="center"
            gap={4}
            height="100%"
            width="100%"
        >
            <Box width={400}>
                <TextField
                    id="header-example"
                    onChange={({ value }) => {
                        setInput(value);
                    }}
                    placeholder="URL to OpenAPI / GraphQL / React"
                    type="text"
                    size="sm"
                    value={input || example?.url}
                    name="example"
                />
            </Box>
        </Flex>
    );
}
