import { fetchViaElectron } from './electronApi';

/**
 * Unified plugin interface that normalizes plugins from different sources
 */
export interface UnifiedPlugin {
    id: string;
    source: 'custom' | 'openvsx';
    slug: string;
    name: string;
    description: string;
    category: string;
    installs: string;
    plan?: string;
    badge?: "New" | "Trending";
    accent: string;
    text: string;
    initials: string;
    publisher: string;
    rating: number;
    reviews: number;
    lastUpdated: string;
    version: string;
    license: string;
    website: string;
    heroSlides?: string[];
    longDescription?: string[];
    keyPoints?: string[];
    features?: string[];
    permissions?: string[];
    tags: string[];
    // OpenVSX specific fields (optional)
    downloadUrl?: string;
    iconUrl?: string;
    readmeUrl?: string;
    repositoryUrl?: string;
    namespace?: string;
}

/**
 * Plugin source interface - all sources must implement this
 */
export interface PluginSource {
    readonly name: string;
    readonly sourceType: 'custom' | 'openvsx';

    /**
     * Search/filter plugins from this source
     */
    search(params: {
        query?: string;
        category?: string;
        offset?: number;
        size?: number;
    }): Promise<UnifiedPlugin[]>;

    /**
     * Get a single plugin by ID/slug
     */
    getPlugin(id: string): Promise<UnifiedPlugin | null>;

    /**
     * Get total count (for pagination)
     */
    getCount(params: { query?: string; category?: string }): Promise<number>;
}

/**
 * Category mapping: our internal categories to OpenVSX categories
 */
const INTERNAL_TO_OPENVSX_CATEGORY: Record<string, string> = {
    'dev': 'Programming Languages',
    'content': 'Documentation',
    'productivity': 'Extension Packs',
    'analytics': 'Data Science',
    'ai': 'Machine Learning',
    'automation': 'Other',
    'support': 'Other',
    'marketing': 'Other',
};

/**
 * Category mapping: OpenVSX to our internal categories (for reverse mapping)
 */
const OPENVSX_CATEGORY_MAP: Record<string, string> = {
    'Programming Languages': 'dev',
    'Snippets': 'dev',
    'Linters': 'dev',
    'Debuggers': 'dev',
    'Formatters': 'dev',
    'Testing': 'dev',
    'Education': 'content',
    'Documentation': 'content',
    'Themes': 'productivity',
    'Extension Packs': 'productivity',
    'Other': 'productivity',
    'Language Packs': 'productivity',
    'Data Science': 'analytics',
    'Machine Learning': 'ai',
    'Notebooks': 'productivity',
    'Visualization': 'analytics',
};

/**
 * OpenVSX API response types
 */
interface OpenVSXExtension {
    namespace: string;
    name: string;
    version: string;
    displayName?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
    license?: string;
    homepage?: string;
    repository?: string;
    downloadUrl?: string;
    averageRating?: number;
    reviewCount?: number;
    downloadCount?: number;
    timestamp?: string;
    publishedBy?: {
        loginName?: string;
    };
    files?: {
        download?: string;
        icon?: string;
        readme?: string;
        signature?: string;
        sha256?: string;
        publicKey?: string;
    };
}

interface OpenVSXQueryResult {
    extensions: OpenVSXExtension[];
    offset: number;
    totalSize: number;
}

/**
 * OpenVSX plugin source implementation
 */
export class OpenVSXPluginSource implements PluginSource {
    readonly name = 'OpenVSX Registry';
    readonly sourceType = 'openvsx' as const;
    private baseUrl = 'https://open-vsx.org/api';

    /**
     * Map OpenVSX extension to unified plugin format
     */
    private mapExtension(ext: OpenVSXExtension): UnifiedPlugin {
        const category = ext.categories?.[0]
            ? OPENVSX_CATEGORY_MAP[ext.categories[0]] || 'dev'
            : 'dev';

        const name = ext.name;
        const initials = name
            .split(/[\s-]/)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Generate accent color based on category
        const accentMap: Record<string, { accent: string; text: string }> = {
            ai: { accent: 'from-fuchsia-400 via-purple-500 to-indigo-500', text: 'text-white' },
            analytics: { accent: 'from-blue-400 via-blue-500 to-blue-600', text: 'text-white' },
            automation: { accent: 'from-green-400 via-green-500 to-green-600', text: 'text-white' },
            support: { accent: 'from-orange-400 via-orange-500 to-orange-600', text: 'text-white' },
            marketing: { accent: 'from-orange-200 via-orange-300 to-orange-500', text: 'text-orange-900' },
            productivity: { accent: 'from-slate-700 via-slate-800 to-slate-900', text: 'text-white' },
            content: { accent: 'from-gray-900 via-gray-800 to-gray-700', text: 'text-white' },
            dev: { accent: 'from-indigo-500 via-indigo-600 to-indigo-700', text: 'text-white' },
        };

        const colors = accentMap[category] || accentMap.dev;

        return {
            id: `${ext.namespace}.${ext.name}`,
            source: 'openvsx',
            slug: `${ext.namespace}-${ext.name}`.toLowerCase(),
            name,
            description: ext.description || 'No description available',
            category,
            installs: ext.downloadCount ? `${Math.floor(ext.downloadCount / 1000)}k+` : '0',
            accent: colors.accent,
            text: colors.text,
            initials,
            publisher: ext.namespace,
            rating: ext.averageRating || 0,
            reviews: ext.reviewCount || 0,
            lastUpdated: ext.timestamp ? new Date(ext.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : 'Unknown',
            version: ext.version,
            license: ext.license || 'Unknown',
            website: ext.homepage || ext.repository || '',
            tags: ext.tags || [],
            downloadUrl: ext.files?.download,
            iconUrl: ext.files?.icon,
            readmeUrl: "README.md",
            repositoryUrl: ext.repository,
            namespace: ext.namespace,
        };
    }

    async search(params: {
        query?: string;
        category?: string;
        offset?: number;
        size?: number;
    }): Promise<UnifiedPlugin[]> {
        const { query = '', category, offset = 0, size = 100 } = params;

        try {
            // Use the search endpoint which supports text search and category filtering
            const url = new URL(`${this.baseUrl}/-/search`);

            if (query) {
                url.searchParams.set('query', query);
            }

            // Map our internal category to OpenVSX category
            if (category && category !== 'all') {
                const openvsxCategory = INTERNAL_TO_OPENVSX_CATEGORY[category];
                if (openvsxCategory) {
                    url.searchParams.set('category', openvsxCategory);
                }
            }

            url.searchParams.set('size', size.toString());
            url.searchParams.set('offset', offset.toString());
            url.searchParams.set('sortBy', 'relevance');
            url.searchParams.set('sortOrder', 'desc');

            const response = await fetchViaElectron(url.toString());

            if (!response.ok) {
                console.error('OpenVSX API error:', response.statusText);
                return [];
            }

            const data: OpenVSXQueryResult = await response.json();

            const plugins = data.extensions.map(ext => this.mapExtension(ext));

            return plugins;
        } catch (error) {
            console.error('Error fetching from OpenVSX:', error);
            return [];
        }
    }

    async getPlugin(id: string): Promise<UnifiedPlugin | null> {
        try {
            // Handle both slug format (namespace-name) and ID format (namespace.name)
            let namespace: string;
            let extensionName: string;

            if (id.includes('.')) {
                // ID format: namespace.name
                [namespace, extensionName] = id.split('.');
            } else if (id.includes('-')) {
                // Slug format: namespace-name
                // Find the first dash and split there
                const dashIndex = id.indexOf('-');
                namespace = id.substring(0, dashIndex);
                extensionName = id.substring(dashIndex + 1);
            } else {
                return null;
            }

            if (!namespace || !extensionName) {
                return null;
            }

            const url = `${this.baseUrl}/${namespace}/${extensionName}`;
            const response = await fetchViaElectron(url);

            if (!response.ok) {
                return null;
            }

            const ext: OpenVSXExtension = await response.json();
            return this.mapExtension(ext);
        } catch (error) {
            console.error('Error fetching plugin from OpenVSX:', error);
            return null;
        }
    }

    async getCount(params: { query?: string; category?: string }): Promise<number> {
        const { query = '', category } = params;

        try {
            // Use the search endpoint to get total count
            const url = new URL(`${this.baseUrl}/-/search`);

            if (query) {
                url.searchParams.set('query', query);
            }

            // Map our internal category to OpenVSX category
            if (category && category !== 'all') {
                const openvsxCategory = INTERNAL_TO_OPENVSX_CATEGORY[category];
                if (openvsxCategory) {
                    url.searchParams.set('category', openvsxCategory);
                }
            }

            url.searchParams.set('size', '1'); // Minimal size to get totalSize
            url.searchParams.set('offset', '0');

            const response = await fetchViaElectron(url.toString());

            if (!response.ok) {
                console.error('OpenVSX getCount failed with status:', response.status);
                return 0;
            }

            const data: OpenVSXQueryResult = await response.json();

            return data.totalSize || 0;
        } catch (error) {
            console.error('Error getting count from OpenVSX:', error);
            return 0;
        }
    }
}
