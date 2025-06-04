export interface Test {
    id: string
    file: string;
    description: string;
    react?: boolean;
    entryPoints?: string[];
    forceSave?: boolean;
    saveUniform?: boolean;
    saveTypedoc?: boolean;
    multiOutput?: boolean;
}