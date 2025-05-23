import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { pluginJsonView } from '../pluginJsonView';
import type { Reference } from '../../types';
import uniform from '../../index'

describe('pluginJsonView', () => {
    it('should handle properties without examples', () => {
        const plugin = pluginJsonView();

        const inputs: Reference[] = [
            {
                title: 'Test title',
                description: 'Test description',
                canonical: 'test-canonical',
                examples: {
                    groups: []
                },
                "definitions": [
                    {
                        "title": "Properties",
                        "properties": [
                            {
                                "name": "charset",
                                "type": "string",
                                "description": "Character encoding for the document\n",
                                "examples": [
                                    "\"UTF-8\""
                                ]
                            },
                            {
                                "name": "robots",
                                "type": "string",
                                "description": "Standard meta tag for controlling search engine crawling and indexing\n",
                                "examples": [
                                    "\"index, follow\"",
                                    "\"noindex, nofollow\""
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Test title',
                description: 'Test description',
                canonical: 'test-canonical',
                examples: {
                    groups: []
                },
                "definitions": [
                    {
                        "title": "Properties",
                        "properties": [
                            {
                                "name": "charset",
                                "type": "string",
                                "description": "Character encoding for the document\n",
                                "examples": [
                                    "UTF-8"
                                ]
                            },
                            {
                                "name": "robots",
                                "type": "string",
                                "description": "Standard meta tag for controlling search engine crawling and indexing\n",
                                "examples": [
                                    "index, follow",
                                    "noindex, nofollow"
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Test title',
                description: 'Test description',
                canonical: 'test-canonical',
                examples: {
                    groups: []
                },
                "definitions": [
                    {
                        "title": "Properties",
                        "properties": [
                            {
                                "name": "robots",
                                "type": "string",
                                "description": "Standard meta tag for controlling search engine crawling and indexing\n",
                                "examples": [
                                    "index, follow",
                                    "noindex, nofollow"
                                ]
                            },
                            {
                                "name": "charset",
                                "type": "string",
                                "description": "Character encoding for the document\n",
                                "examples": [
                                    "UTF-8"
                                ]
                            },
                        ]
                    }
                ]
            }
        ];

        const outputs: string[] = [
            '{\n' +
            '    "charset": "UTF-8",\n' +
            '    "robots": "index, follow" // or "noindex, nofollow"\n' +
            '}',

            '{\n' +
            '    "charset": "UTF-8",\n' +
            '    "robots": "index, follow" // or "noindex, nofollow"\n' +
            '}',

            '{\n' +
            '    "robots": "index, follow", // or "noindex, nofollow"\n' +
            '    "charset": "UTF-8"\n' +
            '}',
        ]
        const result = uniform(inputs, {
            plugins: [plugin]
        });

        expect(result.out.jsonViews).toStrictEqual(outputs);
    });
}); 