/**
 * Returns a hello world message.
 */
export function helloWorld(): string {
    return 'Hello world!';
}

/**
 * Returns a personalized hello world message.
 *
 * @param name - Name of the person to greet.
 * @param enthusiastic - If true, adds an exclamation point to the greeting.
 * @returns A greeting message string.
 */
export function helloWorldV2(name: string, enthusiastic: boolean = false): string {
    return enthusiastic ? `Hello, ${name}!` : `Hello, ${name}`;
}

/**
 * Returns a personalized hello world message.
 * @param name - Name of the person to greet.
 * @typeParam T - The type of the name.
 * @returns A greeting message string.
 */
export function helloWorldV3<T>(name: T): string {
    return `Hello, ${name}!`
}

/**
 * Returns a personalized hello world message.
 */
export class ExampleClass {
    /**
     * Returns a hello world message.
     */
    helloWorld(): string {
        return 'Hello world!';
    }
}

/**
 * Converts a GraphQL schema file to references.
 * 
 * @param schemaLocation - The location of the schema file.
 * 
 * @returns references
 */
export function gqlSchemaToReferences(
    schemaLocation: string
): Promise<[]> {
    if (schemaLocation.endsWith(".graphql")) {
        return Promise.resolve([])
    }

    return Promise.resolve([])
}