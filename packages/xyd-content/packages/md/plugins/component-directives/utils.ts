import { MarkdownComponentDirectiveMap } from "./types"

export function getComponentName(
    name: string,
    supportedDirectives: MarkdownComponentDirectiveMap
) {
    let componentName = ""

    const directive = supportedDirectives[name]

    if (typeof directive === "string") {
        componentName = directive
    } else {
        componentName = toPascalCase(name)
    }

    return componentName
}

function toPascalCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
        .replace(/[^a-zA-Z0-9]/g, " ") // Replace special characters with space
        .split(" ") // Split by space
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
        .join("");
}