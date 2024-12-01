// Define the new PluginV type with a callback function that returns another function
import {Reference} from "./types";

// Define the new PluginV type with a callback function that returns another function
export type UniformPlugin<T> = (cb: (cb: () => T) => void) => (ref: Reference) => void;

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


    const finishCallbacks = new Set();

    config.plugins.forEach((plugin) => {
        const call = plugin(cb => {
            finishCallbacks.add(cb);
        })

        references.forEach((ref) => {
            call(ref)
        });
    })

    finishCallbacks.forEach(cb => {
        if (typeof cb === "function") {
            const resp = cb()
            if (typeof resp !== "object") {
                throw new Error(`Invalid callback return type: ${typeof resp}`)
            }

            response.out = {
                ...response.out,
                ...resp
            }
        } else {
            throw new Error(`Invalid callback type: ${typeof cb}`)
        }
    });

    return response;
}

// Example usage
// const examplePlugin: UniformPlugin<{ value: boolean }> = (cb) => {
//     return (ref: Reference) => {
//     };
// };
// function examplePlugin(cb: (cb: () => { value: boolean }) => void) {
//     cb(() => ({
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
