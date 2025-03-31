import {css} from '@linaria/core';

type StyleObject = Record<string, string>;

export function useStyle<T extends StyleObject>(component: { styles: T }) {
    const styled = {
        ...Object.keys(component.styles).reduce((acc, key) => {
            acc[key] = (strings: TemplateStringsArray, ...values: any[]) => {
                const customStyles = css`
                    ${strings.reduce((result, str, i) => result + str + (values[i] || ''), '')}
                `;
                return `${component.styles[key]} ${customStyles}`;
            };
            return acc;
        }, {} as Record<keyof T, (strings: TemplateStringsArray, ...values: any[]) => string>)
    };

    return styled;
} 