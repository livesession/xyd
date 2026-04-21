import { useTheme } from "../hooks/useTheme";

function ThemeToggle() {
    const { colorScheme, setColorScheme, accentColor, setAccentColor } = useTheme();

    return (
        <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700">
                {(["light", "dark", "system"] as const).map((scheme) => (
                    <button
                        key={scheme}
                        type="button"
                        onClick={() => setColorScheme(scheme)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                            colorScheme === scheme
                                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        }`}
                    >
                        {scheme}
                    </button>
                ))}
            </div>
            <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent"
                title="Accent color"
            />
        </div>
    );
}

export { ThemeToggle };
