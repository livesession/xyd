// Define the new PluginV type with a callback function that returns another function
import {Reference} from "./types";

export * from "./types";

// Define the new PluginV type with a callback function that returns another function
export type UniformPluginArgs = {
    references: Reference[] | Reference,
    defer: (defer: () => any) => void;

    // TODO: maybe in the future
    // visit: (selector: string | "[method] [path]", callback: (...args: any[]) => void) => void;
}


export type UniformPluginRestArgs = {
    index: number;
}
export type UniformPlugin<T> = (args: UniformPluginArgs) => (ref: Reference, restArgs: UniformPluginRestArgs) => void;

// Utility type to infer if a type is an array and avoid wrapping it into an array twice
type NormalizeArray<T> = T extends Array<infer U> ? U[] : T;

// Infer the return type of the plugin callback properly and normalize array types
type PluginResult<T extends UniformPlugin<any>> = T extends UniformPlugin<infer R> ? R : never;

// Merge all plugin return types into a single object and normalize arrays
type MergePluginResults<T extends UniformPlugin<any>[]> = {
    [K in keyof UnionToIntersection<PluginResult<T[number]>>]: NormalizeArray<UnionToIntersection<PluginResult<T[number]>>[K]>
};

// Utility type to handle intersection to an object type
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

// Implement the uniform function
export default function uniform<T extends UniformPlugin<any>[]>(
    references: Reference[],
    config: { plugins: T }
) {
    // Infer the merged result type from all plugins
    type ResultType = MergePluginResults<T>;

    // Initialize the response with a type-safe out object
    const response: {
        references: Reference[]
        out: { [K in keyof ResultType]: ResultType[K] }
    } = {
        references,
        out: {} as { [K in keyof ResultType]: ResultType[K] }
    };

    config.plugins.forEach((plugin) => {
        let defer: any = undefined; // fix any

        const call = plugin({
            references: references,
            defer: (cb) => {
                if (typeof cb === "function") {
                    defer = cb
                }
            },
            // visit: (pattern, callback) => {
            // }
        })

        references.map((ref, i) => {
            call(ref, {
                index: i,
            })
        });

        if (typeof defer === "function") {
            const resp = defer()
            if (typeof resp !== "object") {
                throw new Error(`Invalid callback return type: ${typeof resp}`)
            }

            response.out = {
                ...response.out,
                ...resp
            }
        }
    })

    return response;
}

// Example usage
// const examplePlugin: UniformPlugin<{ value: boolean }> = (cb) => {
//     return (ref: Reference) => {
//     };
// };
// function examplePlugin(defer: (defer: () => { value: boolean }) => void) {
//     defer(() => ({
//         value: true,
//     }));
//
//     return (ref: Reference) => {
//
//     };
// }
// const response = uniform([/* references */], {
//     plugins: [examplePlugin],
// });
// response.out
