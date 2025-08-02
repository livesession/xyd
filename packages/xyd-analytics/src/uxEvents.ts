import { defineEvents } from 'openux-js'

export class NodeFramework {
    location!: string
    uniformRegion!: string
}

export const AnalyticsNodes = {
    Framework: NodeFramework,
} as const

export interface EventsSchema {
    CopyPage: {}
}

// TODO: in the future + maybe better API
export const useUXEvents = defineEvents<EventsSchema, typeof AnalyticsNodes>({
    CopyPage(args, { Framework }) {
        return {
            ...commonUniformProps({ Framework }),
        }
    }
})

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
