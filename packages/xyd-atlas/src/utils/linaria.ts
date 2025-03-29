import {generateClassName} from '@linaria/utils';

export function createCustomClassName(moduleName: string) {
    return (componentPath: string, styleName: string, hash: string) => {
        // Convert component path to PascalCase
        const componentParts = componentPath.split('/');
        const componentName = componentParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('-');

        // Convert style name to camelCase
        const styleNameFormatted = styleName
            .replace(/^[A-Z]/, c => c.toLowerCase())
            .replace(/([A-Z])/g, c => `-${c.toLowerCase()}`);

        // Construct the class name following the pattern:
        // Module-Component-ComponentName__styleName_hash
        return `${moduleName}-Component-${componentName}__${styleNameFormatted}_${hash}`;
    };
} 