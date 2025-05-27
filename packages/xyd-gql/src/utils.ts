/**
 * Helper function to filter fields based on region patterns
 * @param fields - The fields to filter
 * @param prefix - The prefix for the region key (e.g., "Query" or "Mutation")
 * @param regions - The regions to filter by
 * @returns Filtered fields object
 */
export function filterFieldsByRegions<T>(
    fields: Record<string, T>,
    prefix: string,
    regions?: string[]
): Record<string, T> {
    if (!regions || regions.length === 0) {
        return fields;
    }

    const filteredFields: Record<string, T> = {};
    for (const [fieldName, field] of Object.entries(fields)) {
        const regionKey = `${prefix}.${fieldName}`;
        if (regions.some(region => region === regionKey)) {
            filteredFields[fieldName] = field;
        }
    }
    return filteredFields;
}