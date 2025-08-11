import { VFile } from "vfile";

// Define the structure of outputVars with support for multiple types
export type OutputVars<T extends Record<string, any>> = {
    [K in keyof T]: T[K];
};

// Define a custom VFile type that includes outputVars
export interface SymbolxVfile<T extends Record<string, any>> extends VFile {
    data: {
        outputVars?: OutputVars<T>;
        [key: string]: any;
    };
}

