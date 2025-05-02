## Example

```ts
import type { Settings } from '@xyd-js/core'
import {Plugin, component} from '@xyd-js/plugins'
import { mapSettingsToDocSections, type DocSectionSchema } from '@xyd-js/content/md'

import { SearchButton } from './Search'
import { DEFAULT_SUGGESTIONS } from './const'
import type { OramaPluginOptions, OramaCloudConfig, OramaSectionSchema } from './types'

interface OramaPluginData {
    docs: OramaSectionSchema[]

    cloudConfig: OramaCloudConfig | null

    suggestions: string[]
}

export default class OramaPlugin extends Plugin<
    OramaPluginOptions, 
    OramaPluginData
> {
    name = "xyd-orama-plugin"

    override async data() {
        let cloudConfig: OramaCloudConfig | null = null
        if (this.options.endpoint && this.options.apiKey) {
            cloudConfig = {
                endpoint: this.options.endpoint,
                api_key: this.options.apiKey
            }
        }

        const sections = (await mapSettingsToDocSections(this.settings)).map(mapDocSectionsToOrama)

        return {
            docs: sections,
            cloudConfig,
            suggestions: this.options.suggestions || DEFAULT_SUGGESTIONS
        }
    }

    override components() {
        return {
            SearchButton
        }
    }
}

function mapDocSectionsToOrama(doc: DocSectionSchema): OramaSectionSchema {
    return {
        path: doc.pageUrl,

        title: doc.headingTitle,

        description: doc.content,

        content: doc.content,
    }
}
```