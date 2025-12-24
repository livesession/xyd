import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Activity,
    BookA,
    ChevronDown,
    CloudUpload,
    Download,
    Loader2,
    Plug,
    Shield,
    Sparkles,
    Wand2,
} from "lucide-react";
import { useProject } from "../../contexts/ProjectContext";

type SettingsShape = Record<string, any>;

type FieldConfig = {
    label: string;
    description?: string;
    placeholder?: string;
    path: string[];
    input?: "text" | "select" | "textarea";
    options?: { label: string; value: string }[];
};

const fields: FieldConfig[] = [
    {
        label: "Theme name",
        description: "Preset or custom theme identifier.",
        placeholder: "poetry",
        path: ["theme", "name"],
        input: "select",
        options: [
            { label: "poetry", value: "poetry" },
            { label: "cosmo", value: "cosmo" },
            { label: "opener", value: "opener" },
            { label: "picasso", value: "picasso" },
            { label: "gusto", value: "gusto" },
            { label: "solar", value: "solar" },
            { label: "Custom (type below)", value: "" },
        ],
    },
    {
        label: "Color scheme",
        description: "light, dark, os or false.",
        placeholder: "light",
        path: ["theme", "appearance", "colorScheme"],
        input: "select",
        options: [
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "Match OS", value: "os" },
            { label: "Disabled", value: "false" },
        ],
    },
    { label: "Domain", description: "Primary domain for SEO.", placeholder: "docs.example.com", path: ["seo", "domain"] },
    { label: "LLMs txt title", description: "Visible name of the llms.txt file.", placeholder: "LLMs txt", path: ["ai", "llmsTxt", "title"] },
    { label: "LLMs txt base URL", description: "Base URL hosting llms.txt sections.", placeholder: "https://example.com/llms", path: ["ai", "llmsTxt", "baseUrl"] },
    { label: "LLMs txt summary", description: "Optional description shown in llms.txt.", placeholder: "Safe AI usage for our docs.", path: ["ai", "llmsTxt", "summary"], input: "textarea" },
    { label: "OpenAPI source", description: "Path, URL, or JSON configuration.", placeholder: "/specs/openapi.yaml or {\"source\":\"...\"}", path: ["api", "openapi"], input: "textarea" },
    { label: "GraphQL source", description: "Path, URL, or JSON configuration.", placeholder: "/specs/schema.graphql", path: ["api", "graphql"], input: "textarea" },
    { label: "Sources docs", description: "Path, URL, or JSON configuration map.", placeholder: "/specs/sources.json", path: ["api", "sources"], input: "textarea" },
    { label: "Algolia App ID", description: "Algolia application id.", placeholder: "ALGOLIA_APP_ID", path: ["integrations", "search", "algolia", "appId"] },
    { label: "Algolia API Key", description: "Algolia search-only key.", placeholder: "ALGOLIA_API_KEY", path: ["integrations", "search", "algolia", "apiKey"] },
    { label: "Orama endpoint", description: "Orama endpoint URL.", placeholder: "https://cloud.orama.run/...", path: ["integrations", "search", "orama", "endpoint"] },
    { label: "Orama API key", description: "Orama API key.", placeholder: "orama_key", path: ["integrations", "search", "orama", "apiKey"] },
    { label: "LiveSession Track ID", description: "LiveSession analytics trackId.", placeholder: "TRACK_ID", path: ["integrations", "analytics", "livesession", "trackId"] },
    { label: "Chatwoot website token", description: "Chatwoot websiteToken.", placeholder: "chatwoot_token", path: ["integrations", "support", "chatwoot", "websiteToken"] },
    { label: "Intercom app ID", description: "Intercom appId.", placeholder: "intercom_app_id", path: ["integrations", "support", "intercom", "appId"] },
    { label: "LiveChat license ID", description: "LiveChat licenseId.", placeholder: "12345678", path: ["integrations", "support", "livechat", "licenseId"] },
    { label: "Advanced basename", description: "Optional basename for routes.", placeholder: "/docs", path: ["advanced", "basename"] },
];

const DEFAULT_SETTINGS: SettingsShape = {
    theme: { name: "poetry", appearance: { colorScheme: "light" } },
    seo: {},
    ai: {},
    api: {},
    integrations: {},
    advanced: {},
};

function getValue(obj: SettingsShape, path: string[]) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function setValue(obj: SettingsShape, path: string[], value: any) {
    const next = { ...obj };
    let current: any = next;
    path.forEach((key, idx) => {
        if (idx === path.length - 1) {
            current[key] = value;
        } else {
            current[key] = { ...(current[key] || {}) };
            current = current[key];
        }
    });
    return next;
}

function pruneEmpty(obj: any): any {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
        const cleaned = obj.map(pruneEmpty).filter((v) => v !== undefined);
        return cleaned.length ? cleaned : undefined;
    }
    const entries = Object.entries(obj)
        .map(([k, v]) => [k, pruneEmpty(v)] as const)
        .filter(([, v]) => v !== undefined && v !== "");
    if (!entries.length) return undefined;
    return Object.fromEntries(entries);
}

export function GeneralSettings() {
    const { currentRepository, currentBranch, setCurrentRepository, loadFileContent, setFileContent, publishChanges } = useProject();
    const [settings, setSettings] = useState<SettingsShape | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [pushAfterSave, setPushAfterSave] = useState(true);
    const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
    const [showRepoDropdown, setShowRepoDropdown] = useState(false);

    const repoLabel = currentRepository ? `${currentRepository.owner.login}/${currentRepository.name}` : "Select a project";

    useEffect(() => {
        const loadRepos = async () => {
            try {
                const result = await window.electronAPI.repositories.getConnected();
                if (result.success && result.repositories) {
                    setConnectedRepos(result.repositories);
                }
            } catch (err) {
                console.error("Failed to load repositories", err);
            }
        };
        loadRepos();
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!currentRepository) {
                setSettings(null);
                return;
            }
            setLoading(true);
            setError(null);
            setSuccess(null);
            try {
                const raw = await loadFileContent("docs.json");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setSettings(parsed);
                } else {
                    setSettings(DEFAULT_SETTINGS);
                }
            } catch (err) {
                console.error("Failed to load docs.json", err);
                setError("Could not load docs.json for this project.");
                setSettings(DEFAULT_SETTINGS);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [currentRepository, loadFileContent]);

    const handleChange = (path: string[], value: string) => {
        if (!settings) return;
        setSettings(setValue(settings, path, value));
        setSuccess(null);
    };

    const handleSave = async () => {
        if (!currentRepository || !currentBranch || !settings) {
            setError("Select a project before saving.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const cleaned = pruneEmpty(settings) || {};
            const content = JSON.stringify(cleaned, null, 2);
            await setFileContent("docs.json", content);
            if (pushAfterSave) {
                const result = await publishChanges("Update docs.json from settings");
                if (!result.success) {
                    setError(result.error || "Failed to push docs.json");
                    setSaving(false);
                    return;
                }
            }
            setSuccess(pushAfterSave ? "Saved and pushed docs.json" : "Saved docs.json");
        } catch (err) {
            console.error("Failed to save docs.json", err);
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const disabled = !currentRepository || loading || saving || !settings;

    const uiFields = useMemo(
        () =>
            fields.map((field) => {
                const raw = settings ? getValue(settings, field.path) : "";
                const isObject = raw && typeof raw === "object";
                const value = isObject ? JSON.stringify(raw, null, 2) : raw ?? "";
                return { ...field, value };
            }),
        [settings]
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <BookA className="w-4 h-4 text-gray-400" />
                    <span>Project settings</span>
                    <span className="text-gray-900 font-semibold">{repoLabel}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold text-gray-900">General</h1>
                    {currentBranch && (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 text-xs text-gray-700 border border-gray-200">
                            <Sparkles className="w-3 h-3" />
                            Branch {currentBranch}
                        </span>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setShowRepoDropdown((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 transition"
                        >
                            {currentRepository ? currentRepository.name : "Select project"}
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                        {showRepoDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowRepoDropdown(false)} />
                                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                                    {connectedRepos.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-600">No connected repositories</div>
                                    ) : (
                                        connectedRepos.map((repo) => (
                                            <button
                                                key={repo.id}
                                                onClick={() => {
                                                    setCurrentRepository(repo);
                                                    setShowRepoDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-b-0 ${
                                                    currentRepository?.id === repo.id ? "bg-indigo-50 text-indigo-700" : "text-gray-800"
                                                }`}
                                            >
                                                <div className="font-semibold truncate">{repo.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{repo.full_name}</div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    Edit project-wide settings stored in <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">docs.json</code>. Changes are scoped to the selected
                    repository.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    <Plug className="w-4 h-4" />
                    Linked to GitHub: updates will sync to <span className="font-semibold">{repoLabel}</span>
                </div>
            </header>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-gray-900 text-lg">docs.json</p>
                        <p className="text-sm text-gray-600">Top-level settings derived from the provided schema.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600"
                                checked={pushAfterSave}
                                onChange={(e) => setPushAfterSave(e.target.checked)}
                            />
                            Push after save
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={disabled}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition ${
                                disabled ? "bg-gray-300 cursor-not-allowed" : "bg-gray-900 hover:bg-black"
                            }`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                            {saving ? "Saving..." : pushAfterSave ? "Save & Push" : "Save"}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    <Section title="Theme & SEO" icon={<Wand2 className="w-4 h-4 text-indigo-600" />}>
                        <FieldGrid>
                            {uiFields.slice(0, 3).map((field) => (
                                <LabeledField key={field.label} field={field} onChange={handleChange} />
                            ))}
                        </FieldGrid>
                    </Section>

                    <Section title="AI" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>
                        <FieldGrid>
                            {uiFields.slice(3, 6).map((field) => (
                                <LabeledField key={field.label} field={field} onChange={handleChange} />
                            ))}
                        </FieldGrid>
                    </Section>

                    <Section title="API Docs" icon={<Download className="w-4 h-4 text-sky-600" />}>
                        <FieldGrid>
                            {uiFields.slice(6, 9).map((field) => (
                                <LabeledField key={field.label} field={field} onChange={handleChange} />
                            ))}
                        </FieldGrid>
                    </Section>

                    <Section title="Search" icon={<Shield className="w-4 h-4 text-emerald-600" />}>
                        <FieldGrid>
                            {uiFields.slice(9, 13).map((field) => (
                                <LabeledField key={field.label} field={field} onChange={handleChange} />
                            ))}
                        </FieldGrid>
                    </Section>

                    <Section title="Analytics & Support" icon={<Activity className="w-4 h-4 text-orange-600" />}>
                        <FieldGrid>
                            {uiFields.slice(13, 17).map((field) => (
                                <LabeledField key={field.label} field={field} onChange={handleChange} />
                            ))}
                        </FieldGrid>
                    </Section>

                    <Section title="Advanced" icon={<ChevronDown className="w-4 h-4 text-gray-600" />}>
                        <FieldGrid>
                            <LabeledField field={uiFields[17]} onChange={handleChange} />
                        </FieldGrid>
                    </Section>
                </div>
            </section>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    return (
        <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">{icon}</div>
                <p className="font-semibold text-gray-900">{title}</p>
            </div>
            {children}
        </div>
    );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function LabeledField({ field, onChange }: { field: FieldConfig & { value: string }; onChange: (path: string[], value: string) => void }) {
    const handleInput = (val: string) => {
        if (field.input === "textarea") {
            const trimmed = val.trim();
            if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                    const parsed = JSON.parse(val);
                    onChange(field.path, parsed as any);
                    return;
                } catch {
                    onChange(field.path, val);
                    return;
                }
            }
        }
        if (field.input === "select") {
            if (field.path.join(".") === "theme.appearance.colorScheme" && val === "false") {
                onChange(field.path, false as any);
                return;
            }
            onChange(field.path, val);
            return;
        }
        onChange(field.path, val);
    };

    const commonClass =
        "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition";

    return (
        <label className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
            <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">{field.label}</p>
                {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
            </div>
            {field.input === "select" ? (
                <select
                    value={field.value}
                    onChange={(e) => handleInput(e.target.value)}
                    className={commonClass}
                >
                    {field.options?.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : field.input === "textarea" ? (
                <textarea
                    rows={4}
                    value={field.value}
                    onChange={(e) => handleInput(e.target.value)}
                    placeholder={field.placeholder}
                    className={`${commonClass} resize-none`}
                />
            ) : (
                <input
                    value={field.value}
                    onChange={(e) => handleInput(e.target.value)}
                    placeholder={field.placeholder}
                    className={commonClass}
                />
            )}
        </label>
    );
}
