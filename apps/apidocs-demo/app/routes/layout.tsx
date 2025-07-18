import React, { useState, useRef, createContext, useContext, useEffect, useMemo } from 'react';
import {
    Outlet,
    useFetcher,
    useLocation,
    useNavigate,
    useNavigation,
} from "react-router";
import { Box, Button, Dropdown, Flex, TextField, Text, Spinner, FixedZIndex } from 'gestalt';
import GitHubButton from 'react-github-btn'

import { Badge } from "@xyd-js/components/writer"
import { ReactContent } from "@xyd-js/components/content";
import { Atlas, AtlasContext, type VariantToggleConfig } from "@xyd-js/atlas";
import { Surfaces } from "@xyd-js/framework";
import { Framework, FwLink } from "@xyd-js/framework/react";
import ThemePoetry from "@xyd-js/theme-poetry";
import ThemeOpener from "@xyd-js/theme-opener";
import ThemeCosmo from "@xyd-js/theme-cosmo";
import ThemePicasso from "@xyd-js/theme-picasso";
import ThemeGusto from "@xyd-js/theme-gusto";
import ThemeSolar from "@xyd-js/theme-solar";

import poetryCss from '@xyd-js/theme-poetry/index.css?url';
import openerCss from '@xyd-js/theme-opener/index.css?url';
import cosmoCss from '@xyd-js/theme-cosmo/index.css?url';
import picassoCss from '@xyd-js/theme-picasso/index.css?url';
import gustoCss from '@xyd-js/theme-gusto/index.css?url';
import solarCss from '@xyd-js/theme-solar/index.css?url';

import { SETTINGS } from '../settings';
import { useGlobalState } from '../context';

import { DOCS_PREFIX } from '~/const';
import { UrlContext } from '~/context';
import { toUniform } from '~/utils/toUniform';

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
    return <div data-active={props?.active ? "true" : undefined} data-atlas-oas-method={method}>
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
    case "picasso":
        theme = new ThemePicasso()
        break
    case "gusto":   
        theme = new ThemeGusto()
        break
    case "solar":
        theme = new ThemeSolar()
        break
    default:
        theme = null
}

interface DemoContextType {
    example: any;
    setExample: (example: any) => void;
    settings: any;
    fetcher: any;
    isThemeSwitching: boolean;
    setIsThemeSwitching: (switching: boolean) => void;
}

export const DemoContext = createContext<DemoContextType>({
    example: null,
    setExample: () => {
    },
    settings: {},
    fetcher: null,
    isThemeSwitching: false,
    setIsThemeSwitching: () => {
    }
});

export async function loader() {
    return {
        defaultExample: await toUniform(
            "/docs/api",
            "https://raw.githubusercontent.com/livesession/livesession-openapi/master/openapi.yaml",
            "",
            ""
        ),
        // defaultExample: {}
    }
}

export default function Layout({ loaderData }: { loaderData: any }) {
    const [example, setExample] = useState<any>(null);
    const [isThemeSwitching, setIsThemeSwitching] = useState(false);
    const { actionData: globalActionData, setActionData } = useGlobalState();
    const fetcher = useFetcher();
    const navigate = useNavigate()

    let effectiveActionData = globalActionData || null;
    if (!globalActionData?.references?.length && loaderData?.defaultExample?.references?.length) {
        effectiveActionData = {
            ...globalActionData,
            ...loaderData.defaultExample
        }
    }

    useEffect(() => {
        if (!globalActionData?.references?.length && loaderData?.defaultExample?.references?.length) {
            setActionData(loaderData?.defaultExample)

            let canonical = loaderData?.defaultExample?.references?.[0]?.canonical
            if (canonical) {
                canonical = canonical.startsWith("/") ? canonical : `/${canonical}`
                if (canonical.endsWith("/")) {
                    canonical = canonical.slice(0, -1)
                }

                navigate(`${DOCS_PREFIX}${canonical}`)
            }
        }
    }, [])

    const settings = effectiveActionData?.settings || SETTINGS;

    let currentTheme = null;
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
        case "picasso":
            currentTheme = new ThemePicasso();
            break;
        case "gusto":
            currentTheme = new ThemeGusto();
            break;
        case "solar":
            currentTheme = new ThemeSolar();
            break;
        default:
            currentTheme = null;
    }

    const {
        Page: BaseThemePage,
        Layout: BaseThemeLayout,
    } = currentTheme || {};

    return (
        <DemoContext.Provider value={{ example, setExample, settings: effectiveActionData?.settings || SETTINGS, fetcher, isThemeSwitching, setIsThemeSwitching }}>
            <Layout2 effectiveActionData={effectiveActionData} BaseThemePage={BaseThemePage}
                BaseThemeLayout={BaseThemeLayout} />
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
    // BannerContent={MemoizedActionDropdownExample}
    >
        <AtlasContext
            value={{
                syntaxHighlight: effectiveActionData.settings?.theme?.coder?.syntaxHighlight || null,
                baseMatch: "/docs/api",
                variantToggles: atlasVariantToggles,
                Link: FwLink,
            }}
        >
            <MemoizedActionDropdownExample />
            <BaseThemeLayout>
                <UrlContext.Provider value={{ BaseThemePage }}>
                    <Outlet />
                </UrlContext.Provider>
            </BaseThemeLayout>
            <Loader />
        </AtlasContext>
    </Framework>
}, (prevProps, nextProps) => {
    return JSON.stringify(prevProps.effectiveActionData) === JSON.stringify(nextProps.effectiveActionData);
});

function Loader() {
    const { fetcher, isThemeSwitching } = useContext(DemoContext)
    const location = useLocation()
    const [inProgress, setInProgress] = useState(false)

    const previousPathname = useRef(location.pathname)

    const submitting = fetcher.state === "submitting" || fetcher.state === "loading"
    const loading =
        submitting ||
        isThemeSwitching ||
        inProgress

    useEffect(() => {
        if (submitting) {
            setInProgress(true)
        }
    }, [fetcher])

    useEffect(() => {
        if (previousPathname.current !== location.pathname) {
            setInProgress(false)
        }
        previousPathname.current = location.pathname
    }, [location.pathname])

    if (!loading) {
        return null
    }

    return <div style={{
        position: "fixed", // or absolute depending on your needs
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        background: "var(--white)"
    }}>
        <Spinner
            accessibilityLabel="Loading..."
            label={isThemeSwitching ? "Switching theme..." : "Loading..."}
            show={true}
        />
    </div>
}

function MemoizedActionDropdownExample() {
    const { settings: globalSettings } = useContext(DemoContext)
    return <ActionDropdownExample settings={globalSettings} />
}

function ActionDropdownExample({ settings }: { settings: any }) {
    const { example } = useContext(DemoContext)
    const { setActionData } = useGlobalState();
    const { actionData: globalActionData } = useGlobalState();
    const navigate = useNavigate()
    const { fetcher } = useContext(DemoContext)
    const formRef = useRef(null)

    useEffect(() => {
        if (fetcher.data && fetcher.state === "idle") {
            // Preserve current theme settings when API returns data
            const apiDataWithCurrentTheme = {
                ...fetcher.data,
                settings: {
                    ...fetcher.data.settings,
                    theme: settings.theme // Preserve current theme
                }
            }
            setActionData(apiDataWithCurrentTheme)
            let canonical = fetcher?.data?.references?.[0]?.canonical
            if (canonical) {
                canonical = canonical.startsWith("/") ? canonical : `/${canonical}`
                if (canonical.endsWith("/")) {
                    canonical = canonical.slice(0, -1)
                }

                navigate(`${DOCS_PREFIX}${canonical}`)
            }
        } else if (fetcher.state === "loading") {
            // setActionData(data => ({
            //     references: [],
            //     groups: [],
            //     exampleType: "",
            //     settings: {
            //         ...settings,
            //     }
            //     // ...data,
            // }))
            // setActionData({
            //     references: [],
            //     settings: settings, // Use current settings instead of default SETTINGS
            //     groups: [],
            //     exampleType: ""
            // })
        }
    }, [fetcher])

    const loading = fetcher.state === "submitting"
    const disabled = loading || !example?.url

    function onSelect(example: any) {
        fetcher.submit(
            {
                type: example?.type,
                value: example?.value,
                example: example?.url
            },
            { action: "/api/try", method: "post" }
        );
    }

    return (
        <div className="banner-container">
            <div className="banner-left">
                <GithubStars settings={settings} />
            </div>

            <fetcher.Form method="POST" action="/api/try" ref={formRef}>
                <input type="hidden" name="type" value={example?.type} />
                <input type="hidden" name="value" value={example?.value} />
                <input type="hidden" name="currentSettings" value={JSON.stringify(settings)} />
                <Flex alignItems="center" gap={2}>
                    <UniformURLInput />

                    <Flex>
                        <Button type="submit" size="sm" text="Try!" disabled={disabled} />
                    </Flex>

                    <Flex width="100%">
                        <SelectPredefinedUniformURL onSelect={onSelect} />
                    </Flex>
                    {/* TODO: in the futures */}
                    <Flex width="100%">
                        <SelectTheme />
                    </Flex>
                </Flex>
            </fetcher.Form>
            <div />
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

function SelectPredefinedUniformURL({
    onSelect: onSelectCb
}: any) {
    const { setExample, example } = useContext(DemoContext)

    const exmaples = {
        // openai: {
        //     value: "openai",
        //     // url: "https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/master/openapi.yaml",
        //     // url: "https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml",
        //     url: "https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/manual_spec/openapi2.yaml",
        //     label: "OpenAI",
        //     type: "openapi"
        // },
        livesession: {
            value: "livesession",
            url: "https://raw.githubusercontent.com/livesession/livesession-openapi/master/openapi.yaml",
            label: "Livesession",
            type: "openapi"
        },
        vercel: {
            value: "vercel",
            url: "https://openapi.vercel.sh",
            label: "Vercel",
            type: "openapi"
        },
        intercom: {
            value: "intercom",
            url: "https://developers.intercom.com/_spec/docs/references/@2.11/rest-api/api.intercom.io.json",
            label: "Intercom",
            type: "openapi"
        },
        box: {
            value: "box",
            url: "https://raw.githubusercontent.com/box/box-openapi/main/openapi.json",
            label: "Box",
            type: "openapi"
        },
        // github: {
        //     value: "github",
        //     url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.json",
        //     label: "GitHub",
        //     type: "openapi"
        // },
        // digitalocean: {
        //     value: "digitalocean",
        //     url: "https://raw.githubusercontent.com/digitalocean/openapi/main/specification/DigitalOcean-public.v2.yaml",
        //     label: "DigitalOcean",
        //     type: "openapi"
        // },
        monday: {
            value: "monday",
            url: "https://api.monday.com/v2/get_schema?format=sdl",
            label: "Monday.com",
            type: "graphql"
        },
        braintree: {
            value: "braintree",
            url: "https://raw.githubusercontent.com/braintree/graphql-api/master/schema.graphql",
            label: "Braintree",
            type: "graphql"
        },
        githubgraphql: {
            value: "githubgraphql",
            url: "https://docs.github.com/public/fpt/schema.docs.graphql",
            label: "GitHub",
            type: "graphql"
        },
        artsy: {
            value: "artsy",
            url: "https://raw.githubusercontent.com/artsy/metaphysics/main/_schemaV2.graphql",
            label: "Artsy",
            type: "graphql"
        }
    } as any

    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    // const [selected, setSelected] = useState(null)

    const selected = Object.values(exmaples).find((entry: any) => entry.url === example?.url) as any

    const onSelect = ({ item }: any) => {
        // setSelected(item)
        setOpen(false)

        const example = exmaples[item?.value]
        if (!example) return

        setExample(example)
        onSelectCb?.(example)
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
                zIndex={new FixedZIndex(9999)}
            >

                {Object.values(exmaples).map((example: any) => (
                    <Dropdown.Item
                        onSelect={onSelect}
                        option={{ value: example.value, label: example.label }}
                        selected={{
                            value: selected?.value || "",
                            label: selected?.label || ""
                        }}
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
    const { setIsThemeSwitching } = useContext(DemoContext);

    const onSelect = async ({ item }: { item: any }) => {
        setSelected(item);
        setOpen(false);
        setIsThemeSwitching(true);

        try {
            // Update theme in settings
            const newSettings = JSON.parse(JSON.stringify(SETTINGS));
            newSettings.theme = {
                ...newSettings.theme,
                name: item.value
            };

            // Update global theme settings
            (globalThis as any).__xydThemeSettings = newSettings.theme;

            // Dynamically import theme CSS
            const themeName = item.value;

            // Create new theme style link first (but don't append yet)
            const themeStyles = document.createElement('link');
            themeStyles.rel = 'stylesheet';
            let themeCss = poetryCss
            if (themeName === "picasso") {
                themeCss = picassoCss
            } else if (themeName === "cosmo") {
                themeCss = cosmoCss
            } else if (themeName === "opener") {
                themeCss = openerCss
            } else if (themeName === "gusto") {
                themeCss = gustoCss
            } else if (themeName === "solar") {
                themeCss = solarCss
            }
            themeStyles.href = themeCss
            themeStyles.setAttribute('data-theme-style', 'true');


            // Now that new CSS is loaded, remove old theme styles
            const oldThemeStyles = document.querySelectorAll('link[data-theme-style]:not([href*="' + themeName + '"])');
            oldThemeStyles.forEach(style => style.remove());

            // Wait for CSS to load BEFORE removing old styles
            await new Promise<void>((resolve, reject) => {
                themeStyles.onload = () => resolve();
                themeStyles.onerror = () => reject(new Error('Failed to load theme CSS'));
                document.head.appendChild(themeStyles);
            });

            // Remove default theme styles
            const defaultThemeStyles = document.querySelectorAll('link[data-xyd-theme-default]');
            defaultThemeStyles.forEach(style => style.remove());

            // Small delay to ensure CSS is applied
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update global state to trigger re-render with new theme
            setActionData((prev: any) => ({
                ...prev,
                settings: newSettings
            }));

        } catch (error) {
            console.error('Error switching theme:', error);
        } finally {
            setIsThemeSwitching(false);
        }
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
                    zIndex={new FixedZIndex(9999)}
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
    const { example, setExample } = useContext(DemoContext)

    function handleChange(value: string) {
        setExample({
            ...example,
            url: value
        })
    }

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
                        handleChange(value);
                    }}
                    placeholder="URL to OpenAPI / GraphQL / React"
                    type="text"
                    size="sm"
                    value={example?.url || ""}
                    name="example"
                />
            </Box>
        </Flex>
    );
}


