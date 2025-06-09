export function mdParameters(text: string) {
    return {
        attributes: parseAttributes(text),
        props: parseProps(text),
        sanitizedText: removeParameters(text)
    }
}

function parseAttributes(text: string) {
    return parseParameters(text, '[', ']');
}

function parseProps(text: string) {
    return parseParameters(text, '{', '}');
}

function sanitizeParameters(value: string): string {
    // Remove any HTML tags
    value = value.replace(/<[^>]*>/g, '');

    // Remove any script tags and their content
    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove any potentially dangerous characters
    value = value.replace(/[<>'"]/g, '');

    // Remove any control characters
    value = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Trim whitespace
    value = value.trim();

    return value;
}

function removeParameters(text: string): string {
    // Remove square brackets and their content
    text = text.replace(/\[[^\]]*\]/g, '');
    // Remove curly braces and their content
    text = text.replace(/\{[^}]*\}/g, '');
    return text.trim();
}

function parseParameters(
    text: string,
    delimiter: string,
    closingDelimiter: string
) {
    const attributes: Record<string, string> = {};

    // Match patterns like [attr=value], [attr="value"], [!attr], [attr] or {prop=value}, {prop="value"}, {!prop}, {prop}
    const regex = new RegExp(
        `\\${delimiter}(!)?([^=\\${closingDelimiter}]+)(?:=(?:"([^"]*)"|([^\\${closingDelimiter}]*)))?\\${closingDelimiter}`,
        'g'
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        const [_, isNegated, prop, quotedValue, unquotedValue] = match;
        const value = quotedValue !== undefined ? quotedValue : unquotedValue;

        // Sanitize both the property name and value
        let sanitizedParam = sanitizeParameters(prop);
        let sanitizedValue = value ? sanitizeParameters(value) : (isNegated ? 'false' : 'true');

        if (sanitizedParam.startsWith("#") && sanitizedValue === "true") {
            sanitizedValue = sanitizedParam.replace("#", "").trim()
            sanitizedParam = "id"
        }

        attributes[sanitizedParam] = sanitizedValue;
    }

    return attributes;
}
