(function () {
    try {
        var theme = localStorage.getItem('xyd-color-scheme') || 'auto';
        var isDark = false;

        if (theme === 'dark') {
            isDark = true;
        } else if (theme === 'auto') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
    } catch (e) {
        // Fallback to system preference if localStorage fails
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
    }
})();
