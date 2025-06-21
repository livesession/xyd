import { describe, it, expect } from 'vitest';
import { mdParameters } from './mdParameters';

describe('mdParameters', () => {
    describe("attributes", () => {
        it('1.basic', () => {
            const result = mdParameters('Hello [class="test" id="main"] world');

            expect(result.attributes).toEqual({
                class: 'test',
                id: 'main'
            });
            expect(result.props).toEqual({});
            expect(result.sanitizedText).toBe('Hello world');
        });

        it('2.markdown+links', () => {
            const result = mdParameters('[desc="This is [xyd](https://github.com/xyd-js) - a docs framework"]');

            expect(result.attributes).toEqual({
                desc: 'This is [xyd](https://github.com/xyd-js) - a docs framework',
            });
            expect(result.props).toEqual({});
            expect(result.sanitizedText).toBe('');
        });
    })

    describe("props", () => {
        it('1.basic', () => {
            const result = mdParameters('Hello {title="tooltip" disabled} world');

            expect(result.attributes).toEqual({});
            expect(result.props).toEqual({
                title: 'tooltip',
                disabled: 'true'
            });
            expect(result.sanitizedText).toBe('Hello world');
        });
    })

    describe("attributes + props", () => {
        it('1.basic', () => {
            const result = mdParameters('Hello [class="test"] {title="tooltip"} world');

            expect(result.attributes).toEqual({
                class: 'test'
            });
            expect(result.props).toEqual({
                title: 'tooltip'
            });
            expect(result.sanitizedText).toBe('Hello world');
        });
    })

    describe("attributes + htmlMd option", () => {
        it('1.basic', () => {
            const result = mdParameters(
                `[desc="Produces static files within <code>.xyd/build/client</code> which you an deploy easily."]`,
                {
                    htmlMd: true
                }
            );
            expect(result.attributes).toEqual({
                desc: "Produces static files within `.xyd/build/client` which you an deploy easily."
            });

            expect(result.sanitizedText).toBe('');
        });

        it('2.multiple HTML tags in attribute', () => {
            const result = mdParameters(
                `[desc="This is <strong>bold</strong> and <em>italic</em> text with <code>inline code</code>."]`,
                {
                    htmlMd: true
                }
            );
            expect(result.attributes).toEqual({
                desc: "This is **bold** and *italic* text with `inline code`."
            });
        });
    })
});
