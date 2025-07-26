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

