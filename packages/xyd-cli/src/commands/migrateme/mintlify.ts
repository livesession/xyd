import { readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createProcessor } from '@mdx-js/mdx'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import remarkStringify from 'remark-stringify'
import remarkDirective from 'remark-directive'
import remarkMdx from 'remark-mdx'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { Header, Settings as XydSettings } from '@xyd-js/core'

const execAsync = promisify(exec)

// https://leaves.mintlify.com/schema/docs.json
export type MintlifyJSON =
    | {
        theme: "mint";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "maple";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "palm";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "willow";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "linden";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "almond";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    }
    | {
        theme: "aspen";
        /**
         * The URL of the schema file
         */
        $schema?: string;
        /**
         * The name of the project, organization, or product
         */
        name: string;
        /**
         * Optional description used for SEO and LLM indexing
         */
        description?: string;
        colors: ColorsSchema;
        /**
         * The logo configuration. Can be a single image path for both light and dark mode, or separate paths for each mode with an optional click target URL
         */
        logo?:
        | string
        | {
            /**
             * Path pointing to the light logo file to use in dark mode, including the file extension. Example: `/logo.png`
             */
            light: string;
            /**
             * Path pointing to the dark logo file to use in light mode, including the file extension. Example: `/logo-dark.png`
             */
            dark: string;
            /**
             * The URL to redirect to when clicking the logo. If not provided, the logo will link to the homepage. Example: `https://example.com`
             */
            href?: string;
        };
        favicon?:
        | string
        | {
            /**
             * Path pointing to the light favicon file to use in dark mode, including the file extension. Example: `/favicon.png`
             */
            light: string;
            /**
             * Path pointing to the dark favicon file to use in light mode, including the file extension. Example: `/favicon-dark.png`
             */
            dark: string;
        };
        api?: Api;
        appearance?: Appearance;
        background?: Background;
        navbar?: Navbar;
        navigation: NavigationSchema;
        footer?: Footer;
        search?: Search;
        seo?: Seo;
        /**
         * The fonts to be used
         */
        fonts?:
        | {
            /**
             * The font family, such as "Open Sans", "Playfair Display"
             */
            family: string;
            /**
             * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
             */
            weight?: number;
            /**
             * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
             */
            source?: string;
            /**
             * The font format, can be one of woff, woff2
             */
            format?: "woff" | "woff2";
        }
        | {
            heading?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
            body?: {
                /**
                 * The font family, such as "Open Sans", "Playfair Display"
                 */
                family: string;
                /**
                 * The font weight, such as 400, 700. Precise font weights such as 550 are supported for variable fonts.
                 */
                weight?: number;
                /**
                 * The font source, such as https://mintlify-assets.b-cdn.net/fonts/Hubot-Sans.woff2
                 */
                source?: string;
                /**
                 * The font format, can be one of woff, woff2
                 */
                format?: "woff" | "woff2";
            };
        };
        icons?: Icons;
        styling?: Styling;
        redirects?: Redirects;
        integrations?: Integrations;
        banner?: Banner;
        errors?: Errors;
        contextual?: Contextual;
        thumbnails?: Thumbnails;
    };
/**
 * The navigation structure of the content
 */
export type NavigationSchema =
    | {
        global?: Global;
        languages: LanguagesSchema;
    }
    | {
        global?: Global;
        versions: VersionsSchema;
    }
    | {
        global?: Global;
        tabs: TabsSchema;
    }
    | {
        global?: Global;
        dropdowns: DropdownsSchema;
    }
    | {
        global?: Global;
        anchors: AnchorsSchema;
    }
    | {
        global?: Global;
        groups: GroupsSchema;
    }
    | {
        global?: Global;
        pages: PagesSchema;
    };
/**
 * Organizing by languages
 *
 * @minItems 1
 */
export type LanguagesSchema = [LanguageSchema, ...LanguageSchema[]];
/**
 * Organizing by languages
 */
export type LanguageSchema =
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        versions: VersionsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        tabs: TabsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        dropdowns: DropdownsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        anchors: AnchorsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        groups: GroupsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        pages: PagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    };
/**
 * Organizing by versions
 *
 * @minItems 1
 */
export type VersionsSchema = [VersionSchema, ...VersionSchema[]];
export type VersionSchema =
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        languages: LanguagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        tabs: TabsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        dropdowns: DropdownsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        anchors: AnchorsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        groups: GroupsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        pages: PagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    };
/**
 * Organizing by tabs
 *
 * @minItems 1
 */
export type TabsSchema = [TabSchema, ...TabSchema[]];
export type TabSchema =
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        languages: LanguagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        versions: VersionsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        dropdowns: DropdownsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        anchors: AnchorsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        groups: GroupsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        pages: PagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    };
export type DropdownSchema =
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        languages: LanguagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        versions: VersionsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        tabs: TabsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        anchors: AnchorsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        groups: GroupsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        pages: PagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    };
/**
 * Organizing by anchors
 *
 * @minItems 1
 */
export type AnchorsSchema = [AnchorSchema, ...AnchorSchema[]];
export type AnchorSchema =
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        languages: LanguagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        versions: VersionsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        dropdowns: DropdownsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        tabs: TabsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        groups: GroupsSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        pages: PagesSchema;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    }
    | {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
         */
        openapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi?:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
        global?: Global1;
    };
/**
 * Organizing by groups
 *
 * @minItems 1
 */
export type GroupsSchema = [GroupSchema, ...GroupSchema[]];
/**
 * Organizing by groups
 */
export type GroupSchema =
    | {
        /**
         * The name of the group
         */
        group: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A page in the navigation. Referenced by the path to the page. Example: path/to/page
         */
        root?: string;
        /**
         * Tag for the group
         */
        tag?: string;
        openapi: OpenApiSchema;
    }
    | {
        /**
         * The name of the group
         */
        group: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A page in the navigation. Referenced by the path to the page. Example: path/to/page
         */
        root?: string;
        /**
         * Tag for the group
         */
        tag?: string;
        /**
         * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
         */
        asyncapi:
        | string
        | string[]
        | {
            source: string;
            directory?: string;
        };
    }
    | {
        /**
         * The name of the group
         */
        group: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A page in the navigation. Referenced by the path to the page. Example: path/to/page
         */
        root?: string;
        /**
         * Tag for the group
         */
        tag?: string;
        pages: PagesSchema;
    };
/**
 * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
 */
export type OpenApiSchema =
    | string
    | string[]
    | {
        source: string;
        directory?: string;
    };
export type PageOrGroupSchema = PageSchema | GroupSchema;
/**
 * A page in the navigation. Referenced by the path to the page. Example: path/to/page
 */
export type PageSchema = string;
/**
 * An array of page paths or groups
 */
export type PagesSchema = PageOrGroupSchema[];
/**
 * Organizing by dropdowns
 */
export type DropdownsSchema = DropdownSchema[];
export type Redirects = {
    source: string;
    destination: string;
    permanent?: boolean;
}[];

/**
 * The colors to use in your documentation. At the very least, you must define the primary color. For example: { "colors": { "primary": "#ff0000" } }
 */
export interface ColorsSchema {
    /**
     * The primary color of the theme
     */
    primary: string;
    /**
     * The light color of the theme. Used for dark mode
     */
    light?: string;
    /**
     * The dark color of the theme. Used for light mode
     */
    dark?: string;
}

/**
 * API reference configuration and playground settings
 */
export interface Api {
    /**
     * A string or an array of strings of absolute or relative urls pointing to the OpenAPI file(s)
     */
    openapi?:
    | string
    | string[]
    | {
        source: string;
        directory?: string;
    };
    /**
     * A string or an array of strings of absolute or relative urls pointing to the AsyncAPI file(s)
     */
    asyncapi?:
    | string
    | string[]
    | {
        source: string;
        directory?: string;
    };
    /**
     * Configurations for the API parameters
     */
    params?: {
        /**
         * The view mode of the API parameters. Defaults to `closed`.
         */
        expanded?: "all" | "closed";
    };
    /**
     * Configurations for the API playground
     */
    playground?: {
        /**
         * The display mode of the API playground. Defaults to `interactive`.
         */
        display?: "interactive" | "simple" | "none";
        /**
         * Whether to pass API requests through a proxy server. Defaults to `true`.
         */
        proxy?: boolean;
    };
    /**
     * Configurations for the autogenerated API examples
     */
    examples?: {
        /**
         * Whether to show only required parameters in the examples, defaults to `all`.
         */
        defaults?: "required" | "all";
        /**
         * Example languages for the autogenerated API snippets
         */
        languages?: string[];
    };
    /**
     * Configurations for API pages generated from MDX files
     */
    mdx?: {
        /**
         * Authentication configuration for the API
         */
        auth?: {
            /**
             * Authentication method for the API
             */
            method?: "bearer" | "basic" | "key" | "cobo";
            /**
             * Authentication name for the API
             */
            name?: string;
        };
        /**
         * Base URL(s) for the API
         */
        server?: string | string[];
    };
}

/**
 * Light / dark mode toggle settings
 */
export interface Appearance {
    /**
     * The default light/dark mode. Defaults to system
     */
    default?: "system" | "light" | "dark";
    /**
     * Whether to hide the light / dark mode toggle. Defaults to `false`.
     */
    strict?: boolean;
}

/**
 * Background color and decoration settings
 */
export interface Background {
    /**
     * A fixed background image. Can be an absolute URL or relative path.
     */
    image?:
    | string
    | {
        light: string;
        dark: string;
    };
    /**
     * The background decoration of the theme
     */
    decoration?: "gradient" | "grid" | "windows";
    color?: Color;
}

/**
 * The colors of the background
 */
export interface Color {
    /**
     * The color in hex format to use in light mode
     */
    light?: string;
    /**
     * The color in hex format to use in dark mode
     */
    dark?: string;
}

/**
 * Navbar content and settings
 */
export interface Navbar {
    /**
     * The links in the navbar
     */
    links?: {
        label: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    /**
     * The primary CTA in the navbar
     */
    primary?:
    | {
        type: "button";
        label: string;
        /**
         * A valid path or external link
         */
        href: string;
    }
    | {
        type: "github";
        /**
         * A valid path or external link
         */
        href: string;
    };
}

/**
 * Add external links that will appear on all sections and pages irregardless of navigation nesting
 */
export interface Global {
    languages?: {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    versions?: {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    tabs?: {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    dropdowns?: {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    anchors?: {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
}

export interface Color1 {
    /**
     * The color in hex format to use in light mode
     */
    light?: string;
    /**
     * The color in hex format to use in dark mode
     */
    dark?: string;
}

/**
 * Add external links that will appear on all sections and pages irregardless of navigation nesting
 */
export interface Global1 {
    languages?: {
        /**
         * The name of the language in the ISO 639-1 format
         */
        language:
        | "en"
        | "cn"
        | "zh"
        | "zh-Hans"
        | "zh-Hant"
        | "es"
        | "fr"
        | "fr-CA"
        | "ja"
        | "jp"
        | "pt"
        | "pt-BR"
        | "de"
        | "ko"
        | "it"
        | "ru"
        | "id"
        | "ar"
        | "tr"
        | "hi";
        /**
         * Whether this language is the default language
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    versions?: {
        /**
         * The name of the version
         */
        version: string;
        /**
         * Whether this version is the default version
         */
        default?: boolean;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    tabs?: {
        /**
         * The name of the tab
         */
        tab: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    dropdowns?: {
        /**
         * The name of the dropdown
         */
        dropdown: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * The description of the dropdown
         */
        description?: string;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
    anchors?: {
        /**
         * The name of the anchor
         */
        anchor: string;
        /**
         * The icon to be displayed in the section
         */
        icon?:
        | string
        | {
            style?:
            | "brands"
            | "duotone"
            | "light"
            | "regular"
            | "sharp-duotone-solid"
            | "sharp-light"
            | "sharp-regular"
            | "sharp-solid"
            | "sharp-thin"
            | "solid"
            | "thin";
            name: string;
            library?: "fontawesome" | "lucide";
        };
        color?: Color1;
        /**
         * Whether the current option is default hidden
         */
        hidden?: boolean;
        /**
         * A valid path or external link
         */
        href: string;
    }[];
}

/**
 * Footer configurations
 */
export interface Footer {
    /**
     * An object in which each key is the name of a social media platform, and each value is the url to your profile. For example: { "x": "https://x.com/mintlify" }
     */
    socials?: {
        [k: string]: string;
    };
    /**
     * The links to be displayed in the footer
     *
     * @minItems 1
     * @maxItems 4
     */
    links?:
    | [
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        }
    ]
    | [
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        }
    ]
    | [
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        }
    ]
    | [
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        },
        {
            /**
             * The header title of the column
             */
            header?: string;
            /**
             * The links to be displayed in the column
             *
             * @minItems 1
             */
            items: [
                {
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                },
                ...{
                    /**
                     * The label of the link
                     */
                    label: string;
                    /**
                     * The url of the link
                     */
                    href: string;
                }[]
            ];
        }
    ];
}

/**
 * Search display settings
 */
export interface Search {
    /**
     * The prompt to be displayed in the search bar placeholder
     */
    prompt?: string;
}

/**
 * SEO indexing configurations
 */
export interface Seo {
    /**
     * Meta tags added to every page. Must be a valid key-value pair
     */
    metatags?: {
        [k: string]: string;
    };
    /**
     * Specify which pages to be indexed by search engines. Setting `navigable` indexes pages that are set in navigation, `all` indexes all pages. Defaults to `navigable`.
     */
    indexing?: "navigable" | "all";
}

/**
 * Icon library settings
 */
export interface Icons {
    /**
     * The icon library to be used. Defaults to `fontawesome`.
     */
    library: "fontawesome" | "lucide";
}

/**
 * Styling configurations
 */
export interface Styling {
    /**
     * The eyebrows style of the content. Defaults to `section`.
     */
    eyebrows?: "section" | "breadcrumbs";
    /**
     * The codeblock theme. Defaults to `system`.
     */
    codeblocks?: "system" | "dark";
}

/**
 * Configurations for official integrations
 */
export interface Integrations {
    amplitude?: {
        apiKey: string;
    };
    clearbit?: {
        publicApiKey: string;
    };
    fathom?: {
        siteId: string;
    };
    frontchat?: {
        snippetId: string;
    };
    ga4?: {
        measurementId: string;
    };
    gtm?: {
        tagId: string;
    };
    heap?: {
        appId: string;
    };
    hotjar?: {
        hjid: string;
        hjsv: string;
    };
    intercom?: {
        appId: string;
    };
    koala?: {
        publicApiKey: string;
    };
    logrocket?: {
        appId: string;
    };
    mixpanel?: {
        projectToken: string;
    };
    osano?: {
        scriptSource: {
            [k: string]: unknown;
        } & string;
    };
    pirsch?: {
        id: string;
    };
    posthog?: {
        apiKey: string;
        apiHost?: string;
    };
    plausible?: {
        domain: string;
        server?: string;
    };
    segment?: {
        key: string;
    };
    telemetry?: {
        enabled?: boolean;
    };
    cookies?: {
        key?: string;
        value?: string;
    };
}

export interface Banner {
    /**
     * The content of the banner. MDX formatting is supported.
     */
    content: string;
    /**
     * Whether to show the dismiss button on the right side of the banner
     */
    dismissible?: boolean;
}

/**
 * Error pages configuration
 */
export interface Errors {
    "404": {
        /**
         * Whether to redirect to the home page, if the page is not found
         */
        redirect?: boolean;
    };
}

/**
 * Contextual options
 */
export interface Contextual {
    /**
     * Contextual options
     */
    options: ("copy" | "view" | "chatgpt" | "claude")[];
}

export interface Thumbnails {
    /**
     * The appearance of the thumbnail. Defaults to generated by colors.
     */
    appearance?: "light" | "dark";
    /**
     * Background image for the thumbnail. Can be an absolute URL or relative path.
     */
    background?: string;
}

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
    } catch (e) { }

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
            maxTocDepth: 4,
        },
        navigation: {
            header: [],
            sidebar: []
        }
    }

    // Convert Mintlify anchors to XYD navigation structure
    if ("anchors" in docsJson.navigation) {
        console.log("Migrating anchors...")

        const anchors = docsJson.navigation.anchors

        for (const anchor of anchors) {
            // Check if this anchor has groups (navigation structure) or is just an external link
            const hasGroups = 'groups' in anchor && anchor.groups
            const hasHref = 'href' in anchor && anchor.href

            // Create header navigation entry
            const headerEntry: Header = {
                title: anchor.anchor,
                icon: typeof anchor.icon === 'string' ? anchor.icon : anchor.icon?.name
            }

            if (hasHref && !hasGroups) {
                // External link - use href
                headerEntry.href = anchor.href
                headerEntry.float = 'right'
                console.log(`Created external header link: ${anchor.anchor} -> ${anchor.href}`)
            } else if (hasGroups) {
                // Internal navigation - create page route
                const route = anchor.anchor.toLowerCase().replace(/\s+/g, '-')
                headerEntry.page = route
                console.log(`Created internal header page: ${anchor.anchor} -> ${route}`)

                // Convert groups to sidebar pages
                const sidebarPages: any[] = []

                for (const group of anchor.groups) {
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

                // Create sidebar route
                const sidebarRoute = {
                    route: route,
                    pages: sidebarPages
                }

                xydSettings.navigation!.sidebar!.push(sidebarRoute)
                console.log(`Created sidebar route: ${route} for anchor: ${anchor.anchor}`)
            }

            xydSettings.navigation!.header!.push(headerEntry)
        }
    }

    // Convert theme colors if available
    if (docsJson.colors) {
        console.log("Migrating theme colors...")

        // Initialize styles object if it doesn't exist
        if (!xydSettings.theme!.styles) {
            xydSettings.theme!.styles = {}
        }

        xydSettings.theme!.styles!.colors = {
            primary: docsJson.colors.primary
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

        xydSettings.navigation!.header = docsJson.navbar.links.map(link => ({
            title: link.label,
            href: link.href,
            icon: typeof link.icon === 'string' ? link.icon : link.icon?.name
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

        xydSettings.navigation!.footer = {
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
    function migrateNav(navs: GroupsSchema | TabsSchema | DropdownsSchema | AnchorsSchema) {
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
            const headerEntry: Header = {
                title: title,
                icon: typeof nav.icon === 'string' ? nav.icon : nav.icon?.name
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

            xydSettings.navigation!.header!.push(headerEntry)
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
        const items = await readdir(currentDir, { withFileTypes: true })

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
        const items = await readdir(currentDir, { withFileTypes: true })

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
                    children: [{ type: 'text', value: title }]
                })
            }

            if (description) {
                titleAndDescriptionNodes.push({
                    type: 'containerDirective',
                    name: 'subtitle',
                    children: [{ type: 'text', value: description }]
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

        return { colorScheme, src, alt }
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
    return transformedAst || { type: 'root', children: [] }
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
