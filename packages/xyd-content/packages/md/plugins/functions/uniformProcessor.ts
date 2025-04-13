import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { VFile } from 'vfile';
import { sourcesToUniform, type TypeDocReferenceContext } from '@xyd-js/sources';
import { downloadContent, parseImportPath } from './utils';

/**
 * Creates a temporary folder structure with package.json, tsconfig.json, and src/index.ts
 * @param content The content to be placed in src/index.ts
 * @returns The path to the temporary directory
 */
export async function createTempFolderStructure(content: string): Promise<string> {
    // Create a temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-uniform-'));

    // Create the package directory
    const packageDir = path.join(tempDir, 'packages', 'package');
    fs.mkdirSync(packageDir, { recursive: true });

    // Create the src directory
    const srcDir = path.join(packageDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // Create package.json
    const packageJson = {
        "name": "@xyd-sources-examples/package-a",
        "main": "dist/index.js"
    };
    fs.writeFileSync(
        path.join(packageDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    // Create tsconfig.json
    const tsconfigJson = {
        "compilerOptions": {
            "outDir": "./dist"
        }
    };
    fs.writeFileSync(
        path.join(packageDir, 'tsconfig.json'),
        JSON.stringify(tsconfigJson, null, 2)
    );

    // Create src/index.ts with the provided content
    fs.writeFileSync(path.join(srcDir, 'index.ts'), content);

    return tempDir;
}

/**
 * Cleans up the temporary folder structure
 * @param tempDir The path to the temporary directory
 */
export function cleanupTempFolder(tempDir: string): void {
    try {
        // Recursively delete the temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
        console.error(`Error cleaning up temporary directory: ${tempDir}`, error);
    }
}

const programmingExtensions: Record<string, boolean> = {
    'ts': true,
    'js': true,
    'jsx': true,
    'tsx': true,

    // TODO
    // 'py': true,
    // 'go': true,
    // TODO: AND OTHER PROGRAMMING LANGUAGES IN THE FUTEURE
}

/**
 * Check if a file is a programming source file based on its extension
 * @param filePath The path to the file
 * @returns True if the file is a programming source file
 */
export function isProgrammingSource(filePath: string) {
    const extension = path.extname(filePath).toLowerCase().replace('.', '');

    if (programmingExtensions[extension]) {
        return true;
    }

    return false;
}

/**
 * Find the closest package.json directory for a given file path
 * @param baseDir The base directory to start searching from (used as cwd for resolving relative paths)
 * @param filePath The path to the file (can be relative)
 * @returns The path to the directory containing package.json, or null if not found
 */
function findClosestPackageJsonDir(
    baseDir: string,
    filePath: string
): string | null {
    // Resolve the filePath relative to baseDir
    const resolvedFilePath = path.resolve(baseDir, filePath);
    let currentDir = path.dirname(resolvedFilePath);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        try {
            const files = fs.readdirSync(currentDir);
            if (files.includes('package.json')) {
                return currentDir;
            }
        } catch (error) {
            // If we can't read the directory, move up
            console.warn(`Cannot read directory ${currentDir}:`, error);
        }
        currentDir = path.dirname(currentDir);
    }

    return null;
}

/**
 * Check if a path is a local file path (not a URL)
 * @param filePath The path to check
 * @returns True if the path is local
 */
function isLocalPath(filePath: string): boolean {
    return !filePath.startsWith('http://') && !filePath.startsWith('https://');
}

/**
 * Process a uniform file and return the references
 * This is a common function used by both mdFunctionUniform and mdComponentDirective
 * 
 * @param filePath The path to the file to process
 * @param file The VFile object
 * @param resolveFrom Optional base directory to resolve relative paths from
 * @returns A promise that resolves to the references or null if processing failed
 */
export async function processUniformFile(
    filePath: string,
    file: VFile,
    resolveFrom?: string
): Promise<any[] | null> {
    try {
        if (!isProgrammingSource(filePath)) {
            // TODO: openapi + graphql
            throw new Error(`Unsupported file type: ${filePath}`);
        }

        if (isLocalPath(filePath)) {
            const baseDir = resolveFrom || (file.dirname || process.cwd());

            const packageDir = findClosestPackageJsonDir(
                baseDir,
                filePath,
            );

            if (packageDir) {
                // Extract the relative file path from the package directory
                const resolvedFilePath = path.resolve(baseDir, filePath);
                const relativeFilePath = path.relative(packageDir, resolvedFilePath);
                const absoluteFilePath = path.join(packageDir, relativeFilePath);
                
                try {
                    // return []
                    // Process the content using sourcesToUniform
                    const references = await sourcesToUniform(
                        packageDir,
                        [packageDir]
                    ) || []

                    // TODO: in the future via xyd-source? some issues with 
                    return references.filter(ref => {
                        const ctx  = ref?.context as TypeDocReferenceContext

                        return ctx?.fileFullPath === relativeFilePath
                    }) 
                } finally {
                    // Clean up the temporary directory when done
                    // cleanupTempFolder(tempDir);
                }
            }
        }

        // For remote files, download the content
        const content = await downloadContent(
            filePath,
            file,
            resolveFrom,
        );

        // Fallback to creating temporary folder structure if no package.json found
        const tempDir = await createTempFolderStructure(content);

        try {
            // Get the path to the package directory
            const tempPackageDir = path.join(tempDir, 'packages', 'package');

            // Process the content using sourcesToUniform
            const references = await sourcesToUniform(
                tempDir,
                [tempPackageDir]
            );

            return references || null;
        } finally {
            // Clean up the temporary directory when done
            cleanupTempFolder(tempDir);
        }

    } catch (error) {
        console.error(`Error processing uniform file: ${filePath}`, error);
        return null;
    }
}

/**
 * Creates a temporary folder structure that mirrors the original file structure
 * @param packageDir The original package directory
 * @param relativeFilePath The relative file path from the package directory
 * @param absoluteFilePath The absolute file path to the file
 * @returns The path to the temporary directory
 */
export async function createMirroredTempFolderStructure(
    packageDir: string,
    relativeFilePath: string,
    absoluteFilePath: string
): Promise<string> {
    // Create a temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xyd-uniform-'));

    const tempPackageDir = tempDir
    // Create the package directory
    // const tempPackageDir = path.join(tempDir, 'packages', 'package');
    // fs.mkdirSync(tempPackageDir, { recursive: true });

    // Create the directory structure for the file
    const fileDir = path.dirname(relativeFilePath);
    const tempFileDir = path.join(tempPackageDir, fileDir);
    fs.mkdirSync(tempFileDir, { recursive: true });

    // Copy the file content
    const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
    const fileName = path.basename(relativeFilePath);
    fs.writeFileSync(path.join(tempFileDir, fileName), fileContent);

    // Copy and modify package.json
    const originalPackageJsonPath = path.join(packageDir, 'package.json');
    const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf8'));
    
    // Add exports for the relative file path
    const modifiedPackageJson = {
        ...originalPackageJson,
        exports: {
            ...(originalPackageJson.exports || {}),
            [relativeFilePath]: relativeFilePath
        }
    };
    
    fs.writeFileSync(
        path.join(tempPackageDir, 'package.json'),
        JSON.stringify(modifiedPackageJson, null, 2)
    );

    // Copy and modify tsconfig.json
    const originalTsconfigPath = path.join(packageDir, 'tsconfig.json');
    const originalTsconfig = JSON.parse(fs.readFileSync(originalTsconfigPath, 'utf8'));
    
    // Modify the include to only include the relative file path
    const modifiedTsconfig = {
        ...originalTsconfig,
        include: [relativeFilePath]
    };
    
    fs.writeFileSync(
        path.join(tempPackageDir, 'tsconfig.json'),
        JSON.stringify(modifiedTsconfig, null, 2)
    );
    
    return tempDir;
}

/**
 * Process a uniform function call and return the references
 * 
 * @param value The value containing the uniform function call
 * @param file The VFile object
 * @param resolveFrom Optional base directory to resolve relative paths from
 * @returns A promise that resolves to the references or null if processing failed
 */
export async function processUniformFunctionCall(
    value: string,
    file: VFile,
    resolveFrom?: string
): Promise<any[] | null> {
    // Parse the import path to extract file path
    const { filePath } = parseImportPath(value);

    // Process the uniform file
    return processUniformFile(filePath, file, resolveFrom);
} 