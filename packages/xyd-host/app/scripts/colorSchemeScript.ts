(function () {
    try {
        // Get settings from window object (injected by the server)
        const settings = (window).__xydColorSchemeSettings;
        const defaultColorScheme = settings.defaultColorScheme;
        
        var theme = localStorage.getItem('xyd-color-scheme') || defaultColorScheme || 'auto';

        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (isDark) {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
            } else {
                document.documentElement.setAttribute('data-color-scheme', 'light');
            }
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-color-scheme', 'light');
        } else if (theme === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
    } catch (e) {
        // Fallback to system preference if localStorage fails
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'light');
        }
    }
})();
