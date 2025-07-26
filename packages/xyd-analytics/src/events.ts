import { Example } from "@xyd-js/uniform";

import { defineEvents } from 'openux-js'

export class NodeAPIRefSample {
    activeExample!: Example
}

export class NodeCodeSample {
    activeCodeblock!: {
        lang: string;
        code: string;
    }
}

export class NodeFramework {
    location!: string
    uniformRegion!: string
}

export const AnalyticsNodes = {
    APIRefSample: NodeAPIRefSample,
    CodeSample: NodeCodeSample,
    Framework: NodeFramework,
} as const

export interface EventsSchema {
    CodeExampleChange: { example: Example }
    CodeTabChange: { lang: string }
    CodeCopy: { text: string }

    CopyPage: {}
}

export const useEvents = defineEvents<EventsSchema, typeof AnalyticsNodes>({
    CodeExampleChange(args, { APIRefSample, Framework }) {
        return {
            ...commonUniformProps({ Framework }),
            example: args?.example?.description!,
        }
    },
    CodeTabChange(args, { APIRefSample, Framework }) {
        return {
            ...commonCodeTabsProps({ APIRefSample, Framework }),
            lang: args.lang!,
        }
    },
    CodeCopy(args, { APIRefSample, CodeSample, Framework }) {
        return {
            ...commonCodeTabsProps({ APIRefSample, Framework }),
            lang: CodeSample?.activeCodeblock.lang!,
        }
    },

    CopyPage(args, { Framework }) {
        return {
            ...commonUniformProps({ Framework }),
        }
    }
})

function commonCodeTabsProps({
    APIRefSample,
    Framework
}: {
    APIRefSample: NodeAPIRefSample | undefined
    Framework: NodeFramework | undefined
}) {
    return {
        example: APIRefSample?.activeExample?.description!,
        ...commonUniformProps({ Framework }),
    }
}

function commonUniformProps({
    Framework
}: {
    Framework: NodeFramework | undefined
}) {
    return {
        location: Framework?.location!,
        uniformRegion: Framework?.uniformRegion!,
    }
}
