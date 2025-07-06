import { readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createProcessor } from '@mdx-js/mdx'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import remarkStringify from 'remark-stringify'
import remarkDirective from 'remark-directive'
import remarkMdx from 'remark-mdx'

import { Settings as XydSettings } from '@xyd-js/core'

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
                    "fa" // TODO: mintlify supports lucide icons too
                ]
            }
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
            const headerEntry: any = {
                title: anchor.anchor,
                icon: typeof anchor.icon === 'string' ? anchor.icon : anchor.icon?.name
            }

            if (hasHref && !hasGroups) {
                // External link - use href
                headerEntry.href = anchor.href
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
                            icon: typeof anchor.icon === 'string' ? anchor.icon : anchor.icon?.name,
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
        console.log("Mintlify colors are not supported yet")
        // Note: XYD doesn't have direct color mapping, but we could extend this
        // console.log('Theme colors found:', docsJson.colors)
    }

    // Convert logo if available
    if (docsJson.logo) {
        console.log("Migrating logo...")

        if (typeof docsJson.logo === 'string') {
            xydSettings.theme!.logo = docsJson.logo
        } else if (typeof docsJson.logo === 'object') {
            xydSettings.theme!.logo = {
                light: docsJson.logo.light,
                dark: docsJson.logo.dark,
                href: docsJson.logo.href
            }
        }
    }

    // Convert favicon if available
    if (docsJson.favicon) {
        console.log("Migrating favicon...")

        if (typeof docsJson.favicon === 'string') {
            xydSettings.theme!.favicon = docsJson.favicon
        } else if (typeof docsJson.favicon === 'object') {
            // Use light favicon as default, fallback to dark
            xydSettings.theme!.favicon = docsJson.favicon.light || docsJson.favicon.dark
        }
    }

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
                // Skip node_modules, snippets, and other common directories
                if (!['node_modules', '.git', 'dist', 'build', 'snippets'].includes(item.name)) {
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

        // Create MDX processor
        const processor = createProcessor()

        // Parse MDX to AST
        const ast = await processor.parse(bodyContent)

        // Store original MDX string for comment generation
        const originalMdxString = bodyContent

        // Transform Mintlify components to XYD format
        await transformMintlifyComponents(ast, originalMdxString)

        try {
            // Convert AST back to markdown string
            const markdown = remark()
                .use(remarkDirective)
                .use(remarkStringify, {
                    bullet: '-',
                    fences: true,
                    listItemIndent: 'one',
                    incrementListMarker: false,
                })
                .stringify(ast)

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



async function transformMintlifyComponents(ast: any, originalMdxString: string): Promise<any> {
    // Use a recursive approach to handle nested structures properly
    async function transformNode(node: any): Promise<any> {
        if (!node) {
            return null
        }

        // Handle nodes without children first
        if (!node.children) {
            // Remove MDX-specific nodes that don't have children
            if (node.type === 'mdxjsEsm' || node.type === 'mdxJsxTextElement' || node.type === 'mdxFlowExpression') {
                return null
            }
            return node
        }

        // Process children first (bottom-up)
        const processedChildren = []
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

        // Now handle the current node
        if (node.type === 'mdxjsEsm' || node.type === 'mdxJsxTextElement' || node.type === 'mdxFlowExpression') {
            return null // Remove these nodes
        }

        if (node.type === 'mdxJsxFlowElement') {
            const componentName = node.name
            const children = processedChildren

            // Convert Mintlify to XYD components
            switch (componentName) {
                case 'Info':
                case 'Warning':
                case 'Tip':
                case 'Note':
                    console.log(`Transforming ${componentName} to callout`)

                    // Create a new callout directive node
                    return {
                        type: 'containerDirective',
                        name: 'callout',
                        attributes: {
                            type: componentName.toLowerCase()
                        },
                        children: children
                    }
                default:
                    // For unsupported MDX components, convert to HTML comments
                    console.log(`Converting unsupported component ${componentName} to HTML comment`)

                    // Create HTML comment with the original MDX content
                    const commentContent = await serializeMdxNode(node)

                    // Split the comment content into lines and create separate HTML comment nodes
                    const lines = commentContent.split('\n')
                    const commentNodes = lines.map(line => ({
                        type: 'html',
                        value: `<!-- ${line} -->`
                    }))

                    // Return array of comment nodes
                    return commentNodes
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

// Helper function to serialize MDX node back to string with proper formatting
async function serializeMdxNode(node: any, indent: number = 0): Promise<string> {
    try {
        // Create a temporary processor to serialize the node
        const processor = createProcessor()
        const result = await processor.stringify(node)
        return result
    } catch (error) {
        // Fallback: try to reconstruct the component manually with proper formatting
        if (node.type === 'mdxJsxFlowElement') {
            const indentStr = '    '.repeat(indent)
            const attributes = node.attributes?.map((attr: any) =>
                `${attr.name}="${attr.value}"`
            ).join(' ') || ''

            const openTag = `<${node.name}${attributes ? ' ' + attributes : ''}>`
            const closeTag = `</${node.name}>`

            // Serialize children with proper indentation
            const childrenContent = await Promise.all(
                (node.children || []).map(async (child: any) => {
                    if (child.type === 'text') {
                        return child.value
                    } else if (child.type === 'mdxJsxFlowElement') {
                        return await serializeMdxNode(child, indent + 1)
                    } else {
                        return await serializeMdxNode(child, indent)
                    }
                })
            ).then(results => results.join('\n\n' + indentStr))

            if (node.children && node.children.length > 0) {
                return `${openTag}\n\n${indentStr}${childrenContent}\n\n${indentStr}${closeTag}`
            } else {
                return `${openTag}${childrenContent}${closeTag}`
            }
        }

        return `<!-- Unsupported MDX component -->`
    }
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
