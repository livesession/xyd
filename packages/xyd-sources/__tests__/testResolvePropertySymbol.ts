import {describe, it} from 'vitest'

import {DEFINED_DEFINITION_PROPERTY_TYPE, DefinitionProperty} from "@xyd-js/uniform";

const data = {
    "name": "plugins",
    "type": "Plugins",
    "description": "Plugins configuration\n",
    "symbolDef": {
        "id": "116",
        "canonical": ""
    },
    "meta": [],
    "properties": [],
    "ofProperty": {
        "name": "",
        "type": "$$array",
        "description": "Plugin configuration\n",
        "ofProperty": {
            "name": "",
            "description": "",
            "type": "$$union",
            "properties": [
                {
                    "name": "PluginConfig",
                    "type": "PluginConfig",
                    "description": "",
                    "properties": [],
                    "symbolDef": {
                        "id": "117",
                        "canonical": ""
                    },
                    "ofProperty": {
                        "name": "[PluginName, PluginArgs[]]",
                        "type": "[PluginName, PluginArgs[]]",
                        "description": "",
                        "properties": []
                    }
                },
                {
                    "name": "string",
                    "type": "string",
                    "description": "",
                    "properties": []
                }
            ],
            "symbolDef": {
                "id": [
                    "117"
                ],
                "canonical": ""
            }
        },
        "meta": [],
        "symbolDef": {
            "canonical": ""
        },
        "properties": []
    }
}

const data2 = {
    "name": "head",
    "type": "$$array",
    "description": "Head configuration\n",
    "ofProperty": {
        "name": "",
        "description": "",
        "type": "[string, Record<string, string | boolean>]",
        "properties": [],
        "symbolDef": {
            "canonical": ""
        }
    },
    "meta": [],
    "symbolDef": {
        "canonical": ""
    },
    "properties": []
}

const data3 = {
    "name": "sidebar",
    "type": "$$array",
    "description": "Definition of sidebar - an array of groups with all the pages within that group\n",
    "ofProperty": {
        "name": "",
        "description": "",
        "type": "$$union",
        "properties": [
            {
                "name": "SidebarRoute",
                "type": "SidebarRoute",
                "description": "Sidebar multi-group configuration\n",
                "properties": [
                    {
                        "name": "route",
                        "type": "string",
                        "description": "Route for this sidebar group\n",
                        "meta": [
                            {
                                "name": "required",
                                "value": "true"
                            }
                        ],
                        "symbolDef": {
                            "canonical": ""
                        }
                    },
                    {
                        "name": "items",
                        "type": "$$array",
                        "description": "Sidebar items within this group\n",
                        "ofProperty": {
                            "name": "",
                            "description": "",
                            "type": "Sidebar",
                            "properties": [
                                {
                                    "name": "group",
                                    "type": "string",
                                    "description": "The name of the group\n",
                                    "meta": [],
                                    "symbolDef": {
                                        "canonical": ""
                                    }
                                },
                                {
                                    "name": "pages",
                                    "type": "$$array",
                                    "description": "The relative paths to the markdown files that will serve as pages.\nNote: groups are recursive, so to add a sub-folder add another group object in the page array.\n",
                                    "ofProperty": {
                                        "name": "",
                                        "description": "",
                                        "type": "PageURL",
                                        "properties": [],
                                        "symbolDef": {
                                            "id": "50",
                                            "canonical": ""
                                        },
                                        "ofProperty": {
                                            "name": "",
                                            "type": "$$union",
                                            "description": "Page URL type\n",
                                            "symbolDef": {
                                                "id": [
                                                    "45"
                                                ],
                                                "canonical": ""
                                            },
                                            "meta": [],
                                            "properties": [
                                                {
                                                    "name": "Sidebar",
                                                    "type": "Sidebar",
                                                    "description": "Sidebar configuration\n",
                                                    "properties": [
                                                        {
                                                            "name": "group",
                                                            "type": "string",
                                                            "description": "The name of the group\n",
                                                            "meta": [],
                                                            "symbolDef": {
                                                                "canonical": ""
                                                            }
                                                        },
                                                        {
                                                            "name": "pages",
                                                            "type": "$$array",
                                                            "description": "The relative paths to the markdown files that will serve as pages.\nNote: groups are recursive, so to add a sub-folder add another group object in the page array.\n",
                                                            "ofProperty": {
                                                                "name": "",
                                                                "description": "",
                                                                "type": "PageURL",
                                                                "properties": [],
                                                                "symbolDef": {
                                                                    "id": "50",
                                                                    "canonical": ""
                                                                }
                                                            },
                                                            "meta": [],
                                                            "symbolDef": {
                                                                "canonical": ""
                                                            },
                                                            "properties": []
                                                        },
                                                        {
                                                            "name": "icon",
                                                            "type": "string",
                                                            "description": "The icon of the group.\n",
                                                            "meta": [],
                                                            "symbolDef": {
                                                                "canonical": ""
                                                            }
                                                        },
                                                        {
                                                            "name": "sort",
                                                            "type": "number",
                                                            "description": "The sort order of the group.\n",
                                                            "meta": [],
                                                            "symbolDef": {
                                                                "canonical": ""
                                                            }
                                                        }
                                                    ],
                                                    "symbolDef": {
                                                        "id": "45",
                                                        "canonical": ""
                                                    }
                                                },
                                                {
                                                    "name": "string",
                                                    "type": "string",
                                                    "description": "",
                                                    "properties": []
                                                }
                                            ]
                                        }
                                    },
                                    "meta": [],
                                    "symbolDef": {
                                        "canonical": ""
                                    },
                                    "properties": []
                                },
                                {
                                    "name": "icon",
                                    "type": "string",
                                    "description": "The icon of the group.\n",
                                    "meta": [],
                                    "symbolDef": {
                                        "canonical": ""
                                    }
                                },
                                {
                                    "name": "sort",
                                    "type": "number",
                                    "description": "The sort order of the group.\n",
                                    "meta": [],
                                    "symbolDef": {
                                        "canonical": ""
                                    }
                                }
                            ],
                            "symbolDef": {
                                "id": "45",
                                "canonical": ""
                            }
                        },
                        "meta": [
                            {
                                "name": "required",
                                "value": "true"
                            }
                        ],
                        "symbolDef": {
                            "canonical": ""
                        },
                        "properties": []
                    }
                ],
                "symbolDef": {
                    "id": "42",
                    "canonical": ""
                }
            },
            {
                "name": "Sidebar",
                "type": "Sidebar",
                "description": "Sidebar configuration\n",
                "properties": [
                    {
                        "name": "group",
                        "type": "string",
                        "description": "The name of the group\n",
                        "meta": [],
                        "symbolDef": {
                            "canonical": ""
                        }
                    },
                    {
                        "name": "pages",
                        "type": "$$array",
                        "description": "The relative paths to the markdown files that will serve as pages.\nNote: groups are recursive, so to add a sub-folder add another group object in the page array.\n",
                        "ofProperty": {
                            "name": "",
                            "description": "",
                            "type": "PageURL",
                            "properties": [],
                            "symbolDef": {
                                "id": "50",
                                "canonical": ""
                            },
                            "ofProperty": {
                                "name": "",
                                "type": "$$union",
                                "description": "Page URL type\n",
                                "symbolDef": {
                                    "id": [
                                        "45"
                                    ],
                                    "canonical": ""
                                },
                                "meta": [],
                                "properties": [
                                    {
                                        "name": "Sidebar",
                                        "type": "Sidebar",
                                        "description": "Sidebar configuration\n",
                                        "properties": [
                                            {
                                                "name": "group",
                                                "type": "string",
                                                "description": "The name of the group\n",
                                                "meta": [],
                                                "symbolDef": {
                                                    "canonical": ""
                                                }
                                            },
                                            {
                                                "name": "pages",
                                                "type": "$$array",
                                                "description": "The relative paths to the markdown files that will serve as pages.\nNote: groups are recursive, so to add a sub-folder add another group object in the page array.\n",
                                                "ofProperty": {
                                                    "name": "",
                                                    "description": "",
                                                    "type": "PageURL",
                                                    "properties": [],
                                                    "symbolDef": {
                                                        "id": "50",
                                                        "canonical": ""
                                                    }
                                                },
                                                "meta": [],
                                                "symbolDef": {
                                                    "canonical": ""
                                                },
                                                "properties": []
                                            },
                                            {
                                                "name": "icon",
                                                "type": "string",
                                                "description": "The icon of the group.\n",
                                                "meta": [],
                                                "symbolDef": {
                                                    "canonical": ""
                                                }
                                            },
                                            {
                                                "name": "sort",
                                                "type": "number",
                                                "description": "The sort order of the group.\n",
                                                "meta": [],
                                                "symbolDef": {
                                                    "canonical": ""
                                                }
                                            }
                                        ],
                                        "symbolDef": {
                                            "id": "45",
                                            "canonical": ""
                                        }
                                    },
                                    {
                                        "name": "string",
                                        "type": "string",
                                        "description": "",
                                        "properties": []
                                    }
                                ]
                            }
                        },
                        "meta": [],
                        "symbolDef": {
                            "canonical": ""
                        },
                        "properties": []
                    },
                    {
                        "name": "icon",
                        "type": "string",
                        "description": "The icon of the group.\n",
                        "meta": [],
                        "symbolDef": {
                            "canonical": ""
                        }
                    },
                    {
                        "name": "sort",
                        "type": "number",
                        "description": "The sort order of the group.\n",
                        "meta": [],
                        "symbolDef": {
                            "canonical": ""
                        }
                    }
                ],
                "symbolDef": {
                    "id": "45",
                    "canonical": ""
                }
            }
        ],
        "symbolDef": {
            "id": [
                "42",
                "45"
            ],
            "canonical": ""
        }
    },
    "meta": [
        {
            "name": "required",
            "value": "true"
        }
    ],
    "symbolDef": {
        "canonical": ""
    },
    "properties": []
}

const data4 = {
    "name": "paths",
    "type": "EnginePaths",
    "description": "Path aliases for imports. Avoid long relative paths by creating shortcuts.\n",
    "symbolDef": {
        "id": "132",
        "canonical": ""
    },
    "meta": [],
    "examples": [
        "```json\n{\n  \"paths\": {\n    \"@my-package/*\": [\"../my-package/src/*\"],\n    \"@livesession-go/*\": [\"https://github.com/livesession/livesession-go/*\"]\n  }\n}",
        "```typescript\n// Instead of\n@importCode(\"../../../my-package/src/components/Badge.tsx\")\n\n// Use\n@importCode(\"@my-package/src/components/Badge.tsx\")"
    ],
    "properties": [],
    "ofProperty": {
        "name": "",
        "type": "$$union",
        "description": "",
        "properties": [],
        "meta": [],
        "ofProperty": {
            "name": "",
            "type": "{\n    [key: string]: string[];\n}",
            "description": ""
        },
        "symbolDef": {
            "canonical": ""
        }
    }
}

const data5 = {
    "name": "metatags",
    "type": "$$union",
    "description": "Meta tags\n",
    "properties": [],
    "meta": [],
    "ofProperty": {
        "name": "",
        "type": "{\n    [tag: string]: string;\n}",
        "description": ""
    },
    "symbolDef": {
        "canonical": ""
    }
}


const data6 = {
    "name": "openapi",
    "type": "APIFile",
    "description": "OpenAPI configuration\n",
    "symbolDef": {
        "id": "75",
        "canonical": ""
    },
    "meta": [],
    "properties": [],
    "ofProperty": {
        "name": "",
        "type": "$$union",
        "description": "API file configuration. Can be a path, an array of paths, a map of paths, or an advanced configuration\n",
        "symbolDef": {
            "id": [
                "76",
                "80"
            ],
            "canonical": ""
        },
        "meta": [],
        "properties": [
            {
                "name": "APIFileMap",
                "type": "APIFileMap",
                "description": "API file map type\n",
                "properties": [],
                "symbolDef": {
                    "id": "76",
                    "canonical": ""
                },
                "ofProperty": {
                    "name": "",
                    "type": "{\n    [name: string]: string | APIFileAdvanced;\n}",
                    "description": ""
                }
            },
            {
                "name": "APIFileAdvanced",
                "type": "APIFileAdvanced",
                "description": "API file advanced type\n",
                "properties": [
                    {
                        "name": "info",
                        "type": "APIInfo",
                        "description": "API information configuration\n",
                        "symbolDef": {
                            "id": "84",
                            "canonical": ""
                        },
                        "meta": [],
                        "properties": [
                            {
                                "name": "baseUrl",
                                "type": "string",
                                "description": "The base url for all API endpoints. If baseUrl is an array, it will enable\nfor multiple base url options that the user can toggle.\n",
                                "meta": [],
                                "symbolDef": {
                                    "canonical": ""
                                }
                            },
                            {
                                "name": "auth",
                                "type": "APIAuth",
                                "description": "Authentication information\n",
                                "symbolDef": {
                                    "id": "91",
                                    "canonical": ""
                                },
                                "meta": [],
                                "properties": [
                                    {
                                        "name": "method",
                                        "type": "\"bearer\" | \"basic\" | \"key\"",
                                        "description": "The authentication strategy used for all API endpoints\n",
                                        "symbolDef": {
                                            "id": [],
                                            "canonical": ""
                                        },
                                        "meta": [
                                            {
                                                "name": "required",
                                                "value": "true"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "name": "name",
                                "type": "string",
                                "description": "The name of the authentication parameter used in the API playground.\nIf method is basic, the format should be [usernameName]:[passwordName]\n",
                                "meta": [],
                                "symbolDef": {
                                    "canonical": ""
                                }
                            },
                            {
                                "name": "inputPrefix",
                                "type": "string",
                                "description": "The default value that's designed to be a prefisx for the authentication input field.\nE.g. If an inputPrefix of AuthKey would inherit the default input result of the authentication field as AuthKey.\n",
                                "meta": [],
                                "symbolDef": {
                                    "canonical": ""
                                }
                            },
                            {
                                "name": "playground",
                                "type": "APIPlayground",
                                "description": "Configurations for the API playground\n",
                                "symbolDef": {
                                    "id": "93",
                                    "canonical": ""
                                },
                                "meta": [],
                                "properties": [
                                    {
                                        "name": "mode",
                                        "type": "\"show\" | \"simple\" | \"hide\"",
                                        "description": "Playground display mode\n",
                                        "symbolDef": {
                                            "id": [],
                                            "canonical": ""
                                        },
                                        "meta": []
                                    }
                                ]
                            },
                            {
                                "name": "request",
                                "type": "APIInfoRequest",
                                "description": "Request configuration\n",
                                "symbolDef": {
                                    "id": "95",
                                    "canonical": ""
                                },
                                "meta": [],
                                "properties": [
                                    {
                                        "name": "example",
                                        "type": "{\n    languages?: string[];\n}",
                                        "description": "Configurations for the auto-generated API request examples\n",
                                        "properties": [
                                            {
                                                "name": "languages",
                                                "type": "string[]",
                                                "description": "An array of strings that determine the order of the languages of the auto-generated request examples.\nYou can either define custom languages utilizing x-codeSamples or use our default languages which include\nbash, python, javascript, php, go, java\n",
                                                "meta": []
                                            }
                                        ],
                                        "meta": [],
                                        "symbolDef": {
                                            "canonical": ""
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "route",
                        "type": "string",
                        "description": "Route configuration\n",
                        "meta": [
                            {
                                "name": "required",
                                "value": "true"
                            }
                        ],
                        "symbolDef": {
                            "canonical": ""
                        }
                    }
                ],
                "symbolDef": {
                    "id": "80",
                    "canonical": ""
                }
            },
            {
                "name": "string",
                "type": "string",
                "description": "",
                "properties": []
            },
            {
                "name": "string[]",
                "type": "string[]",
                "description": "",
                "properties": []
            }
        ]
    }
}

const data7 = {
    "name": "APIFileMap",
    "type": "APIFileMap",
    "description": "API file map type\n",
    "properties": [],
    "symbolDef": {
        "id": "76",
        "canonical": ""
    },
    "ofProperty": {
        "name": "",
        "type": "{\n    [name: string]: string | APIFileAdvanced;\n}",
        "description": ""
    }
}
describe("resolvePropertySymbol", () => {
    it("should resolve simple property type", () => {
            const resp = resolvePropertySymbol(data7)

            console.log(resp.join(" "))
        }
    )
})

function resolvePropertySymbol(property: DefinitionProperty): string[] {
    if (property?.ofProperty) {
        switch (property.ofProperty.type) {
            case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
                let ofOfSymbols: string[] = []

                if (property.type) {
                    ofOfSymbols.push(property.type)
                }

                if (property.ofProperty.ofProperty) {
                    const symbols = groupSymbol(property.ofProperty.ofProperty)

                    ofOfSymbols.push(...symbols)
                }

                const atomicDefinedSymbol = atomicDefinedPropertySymbol(property.ofProperty)
                const ofPrefix = [
                    atomicDefinedSymbol,
                    "of"
                ]

                return [
                    ...ofPrefix,
                    ...ofOfSymbols
                ]
            }
            case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
            case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
            case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
                if (property.ofProperty.properties?.length) {
                    const atomicDefinedSymbol = atomicDefinedPropertySymbol(property)

                    if (atomicDefinedSymbol) {
                        const unionSymbol = groupSymbol({
                            name: "",
                            description: "",
                            type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
                            properties: property.ofProperty.properties || [],
                        })

                        return [
                            atomicDefinedSymbol,
                            "of",
                            ...unionSymbol
                        ]
                    }

                    return [
                        property.type,
                        ...groupSymbol(property.ofProperty)
                    ]
                }

                if (property.ofProperty?.ofProperty) {
                    return [property.ofProperty?.ofProperty?.type]
                }

                return []
            }
            default: {
                if (!property.ofProperty.name) {
                    const defined = atomicDefinedPropertySymbol(property)
                    const symbol = atomicPropertySymbol(property)

                    if (symbol.startsWith("$$")) {
                        return [property.ofProperty.type]
                    }

                    const chains = [
                        symbol
                    ]

                    if (defined) {
                        chains.push("of")
                    }

                    chains.push(
                        ...groupSymbol(property.ofProperty)
                    )

                    return chains
                }

                return [
                    property.ofProperty.type
                ]
            }
        }
    }

    switch (property.type) {
        case DEFINED_DEFINITION_PROPERTY_TYPE.UNION: {
            if (property.properties?.length) {
                const resp: string[] = []
                for (const prop of property.properties) {
                    let symbols = resolvePropertySymbol(prop)

                    if (prop.ofProperty && symbols.length > 1) {
                        symbols = [[
                            symbols[0],
                                ...symbols.slice(1, symbols.length),
                        ].join("")]
                    }

                    resp.push(...symbols)
                }

                return [resp.join(" or ")]
            }
        }
    }

    return [property.type]
}
function atomicDefinedPropertySymbol(property: DefinitionProperty): string {
    switch (property.type) {
        case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
            return "array"
        }
        case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
        case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
        case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
            return ""
        }

        default: {
            return ""
        }
    }
}
function groupSymbol(property: DefinitionProperty) {
    const symbols = resolvePropertySymbol(property)
    symbols[0] = "(" + symbols[0]
    symbols[symbols.length - 1] = symbols[symbols.length - 1] + ")"

    return symbols
}
function atomicPropertySymbol(property: DefinitionProperty): string {
    const defined = atomicDefinedPropertySymbol(property)

    if (!defined) {
        return property.type
    }

    return defined
}