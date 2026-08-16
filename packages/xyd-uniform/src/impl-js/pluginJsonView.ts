import type { UniformPluginArgs, UniformPlugin } from "../index";
import { Reference } from "../types";

export interface pluginJsonViewOptions {
}

type pluginJsonViewOutput = {
    jsonViews: string;
}

export function pluginJsonView(
    options?: pluginJsonViewOptions
): UniformPlugin<pluginJsonViewOutput> {

    return function pluginJsonViewInner({
        defer,
    }: UniformPluginArgs) {
        const jsonViews: string[] = [];

        defer(() => ({
            jsonViews
        }))

        return (ref: Reference) => {
            // Build the output string manually to ensure exact format
            const lines: string[] = [];
            lines.push('{');
            
            ref.definitions.forEach(def => {
                def.properties.forEach((prop, index) => {
                    // Remove any quotes and trailing characters from the value
                    const value = (prop.examples?.[0] || '').replace(/^"|"$|[^a-zA-Z0-9\s\-_.,:/@#=;+()]/g, '');
                    const comment = prop.examples && prop.examples.length > 1 
                        ? ` // or "${(prop.examples as string[])[1].replace(/^"|"$|[^a-zA-Z0-9\s\-_.,:/@#=;+()]/g, '')}"`
                        : '';
                    const isLast = index === def.properties.length - 1;
                    // Add comma after the value but before the comment
                    lines.push(`    "${prop.name}": "${value}"${isLast ? '' : ','}${comment}`);
                });
            });
            
            lines.push('}');
            
            jsonViews.push(lines.join('\n'));
        }
    }
}

// example usage:
// const response = uniform([/* references */], {
//     plugins: [pluginJsonView({
//         
//     })],
// });
