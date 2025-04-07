import {css} from '@linaria/core';

type StyleObject = Record<string, string>;
type StyleFunction = (strings: TemplateStringsArray, ...values: any[]) => string;

export function useStyle<T extends StyleObject>(component: { styles: T }) {
    const styled = {} as Record<keyof T, StyleFunction>;

    for (const key of Object.keys(component.styles)) {
        styled[key as keyof T] = (strings: TemplateStringsArray, ...values: any[]) => {
            const customStyles = css`
                ${strings.reduce((result, str, i) => result + str + (values[i] || ''), '')}
            `;
            return `${component.styles[key]} ${customStyles}`;
        };
    }

    return styled;
} 