import { integrationCatalog, type IntegrationMeta } from '../data/integrations';
import type { PluginSource, UnifiedPlugin } from './pluginSources';

/**
 * Custom plugin source implementation using local integration catalog
 */
export class CustomPluginSource implements PluginSource {
    readonly name = 'Custom Integrations';
    readonly sourceType = 'custom' as const;

    /**
     * Map IntegrationMeta to UnifiedPlugin format
     */
    private mapIntegration(integration: IntegrationMeta): UnifiedPlugin {
        return {
            id: `custom.${integration.slug}`,
            source: 'custom',
            slug: integration.slug,
            name: integration.name,
            description: integration.description,
            category: integration.category,
            installs: integration.installs,
            plan: integration.plan,
            badge: integration.badge,
            accent: integration.accent,
            text: integration.text,
            initials: integration.initials,
            publisher: integration.publisher,
            rating: integration.rating,
            reviews: integration.reviews,
            lastUpdated: integration.lastUpdated,
            version: integration.version,
            license: integration.license,
            website: integration.website,
            heroSlides: integration.heroSlides,
            longDescription: integration.longDescription,
            keyPoints: integration.keyPoints,
            features: integration.features,
            permissions: integration.permissions,
            tags: integration.tags,
        };
    }

    async search(params: {
        query?: string;
        category?: string;
        offset?: number;
        size?: number;
    }): Promise<UnifiedPlugin[]> {
        const { query = '', category, offset = 0, size = 100 } = params;

        const term = query.toLowerCase();

        let filtered = integrationCatalog.filter((integration) => {
            const matchesCategory = !category || category === 'all' || integration.category === category;
            const matchesQuery =
                !query ||
                integration.name.toLowerCase().includes(term) ||
                integration.description.toLowerCase().includes(term) ||
                integration.tags.some(tag => tag.toLowerCase().includes(term));

            return matchesCategory && matchesQuery;
        });

        // Apply pagination
        const paginated = filtered.slice(offset, offset + size);

        return paginated.map(integration => this.mapIntegration(integration));
    }

    async getPlugin(id: string): Promise<UnifiedPlugin | null> {
        // Remove 'custom.' prefix if present
        const slug = id.startsWith('custom.') ? id.slice(7) : id;

        const integration = integrationCatalog.find(i => i.slug === slug);

        if (!integration) {
            return null;
        }

        return this.mapIntegration(integration);
    }

    async getCount(params: { query?: string; category?: string }): Promise<number> {
        const { query = '', category } = params;

        const term = query.toLowerCase();

        return integrationCatalog.filter((integration) => {
            const matchesCategory = !category || category === 'all' || integration.category === category;
            const matchesQuery =
                !query ||
                integration.name.toLowerCase().includes(term) ||
                integration.description.toLowerCase().includes(term) ||
                integration.tags.some(tag => tag.toLowerCase().includes(term));

            return matchesCategory && matchesQuery;
        }).length;
    }
}
