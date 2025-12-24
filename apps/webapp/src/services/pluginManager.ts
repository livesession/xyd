import type { PluginSource, UnifiedPlugin } from './pluginSources';
import { CustomPluginSource } from './customPluginSource';
import { OpenVSXPluginSource } from './pluginSources';

/**
 * Plugin manager that aggregates plugins from multiple sources
 */
export class PluginManager {
    private sources: PluginSource[] = [];

    constructor(sources?: PluginSource[]) {
        this.sources = sources || [
            new CustomPluginSource(),
            new OpenVSXPluginSource(),
        ];
    }

    /**
     * Add a new plugin source
     */
    addSource(source: PluginSource): void {
        this.sources.push(source);
    }

    /**
     * Remove a plugin source by name
     */
    removeSource(sourceName: string): void {
        this.sources = this.sources.filter(s => s.name !== sourceName);
    }

    /**
     * Get all registered sources
     */
    getSources(): PluginSource[] {
        return [...this.sources];
    }

    /**
     * Search plugins across all sources
     */
    async search(params: {
        query?: string;
        category?: string;
        offset?: number;
        size?: number;
        sources?: ('custom' | 'openvsx')[];
    }): Promise<UnifiedPlugin[]> {
        const { sources: sourcesFilter, ...searchParams } = params;

        // Filter sources if specified
        const activeSources = sourcesFilter
            ? this.sources.filter(s => sourcesFilter.includes(s.sourceType))
            : this.sources;

        // Search all sources in parallel with error handling
        const results = await Promise.all(
            activeSources.map(async (source) => {
                try {
                    return await source.search(searchParams);
                } catch (error) {
                    console.error(`Error searching ${source.name}:`, error);
                    return []; // Return empty array on error so other sources still work
                }
            })
        );

        // Flatten and combine results
        const combined = results.flat();

        // Sort by rating (descending) and installs
        return combined.sort((a, b) => {
            if (b.rating !== a.rating) {
                return b.rating - a.rating;
            }

            // Extract numeric value from installs string (e.g., "5k+" -> 5000)
            const aInstalls = this.parseInstalls(a.installs);
            const bInstalls = this.parseInstalls(b.installs);

            return bInstalls - aInstalls;
        });
    }

    /**
     * Get a single plugin by ID
     * ID format: {source}.{slug} or just {slug} (will search all sources)
     */
    async getPlugin(id: string): Promise<UnifiedPlugin | null> {
        // Try each source
        for (const source of this.sources) {
            const plugin = await source.getPlugin(id);
            if (plugin) {
                return plugin;
            }
        }

        return null;
    }

    /**
     * Get total count across all sources
     */
    async getCount(params: {
        query?: string;
        category?: string;
        sources?: ('custom' | 'openvsx')[];
    }): Promise<number> {
        const { sources: sourcesFilter, ...countParams } = params;

        // Filter sources if specified
        const activeSources = sourcesFilter
            ? this.sources.filter(s => sourcesFilter.includes(s.sourceType))
            : this.sources;

        // Get counts from all sources in parallel with error handling
        const counts = await Promise.all(
            activeSources.map(async (source) => {
                try {
                    return await source.getCount(countParams);
                } catch (error) {
                    console.error(`Error getting count from ${source.name}:`, error);
                    return 0; // Return 0 on error so other sources still work
                }
            })
        );

        // Sum all counts
        return counts.reduce((total, count) => total + count, 0);
    }

    /**
     * Parse install count string to number
     */
    private parseInstalls(installsStr: string): number {
        const match = installsStr.match(/^(\d+(?:\.\d+)?)(k|m)?/i);

        if (!match) {
            return 0;
        }

        const [, num, unit] = match;
        let value = parseFloat(num);

        if (unit?.toLowerCase() === 'k') {
            value *= 1000;
        } else if (unit?.toLowerCase() === 'm') {
            value *= 1000000;
        }

        return value;
    }
}

/**
 * Default singleton instance
 */
export const pluginManager = new PluginManager();
