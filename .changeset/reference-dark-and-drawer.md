---
"@xyd-js/atlas": patch
"@xyd-js/components": patch
"@xyd-js/core": patch
"@xyd-js/documan": patch
"@xyd-js/host": patch
"@xyd-js/native": patch
"@xyd-js/plugin-docs": patch
"@xyd-js/themes": patch
"@xyd-js/theme-cosmo": patch
"@xyd-js/theme-gusto": patch
"@xyd-js/theme-opener": patch
"@xyd-js/theme-picasso": patch
"@xyd-js/theme-poetry": patch
"@xyd-js/theme-solar": patch
"@xyd-js/theme-terrarium": patch
---

Reference pages read in every colour scheme. In dark mode, OS-chosen or picked on the site, option and argument names, their descriptions, type names and the usage box take the theme's dark colours: the reference's default tokens sit in the `defaults` layer, and the bun engine links the shared stylesheets before the theme's own, as the Vite engine does. Every text on a CLI, OpenAPI or GraphQL reference page clears WCAG AA in light and dark mode in all seven themes: links take a shade of the theme's accent that clears 4.5:1 (gusto and poetry in light mode, cosmo, opener and picasso in dark mode), a hovered link (in running text or in the reference) stays at least as far from the page as the link at rest, and the syntax colours, the HTTP method badges and error text clear AA too. Links in running text are underlined. A site's own primary, from `theme.appearance.colors` or from the `--color-primary` token in `theme.appearance.cssTokens`, still colours its links and the reference's accent.

On a phone the sidebar drawer closes when the page changes, when a link in it is tapped and on Escape; opening it moves focus to the current page's link and closing it returns focus to the menu button, and while closed it is inert and casts no shadow. A page's trailing-slash form (`/cli/deploy/`) lands on the page: a 308 from both dev servers (under `advanced.basename` too) and from `xyd serve`, and a `404.html` in the static build that moves the browser on. The static build and the self-contained binary ship React's production build, and the binary builds a project's components for it, so pages with a project component hydrate and log no React warnings.
