import {
    GuideCard,
    IconSessionReplay
} from "@xyd-js/components/writer"

export function Tutorial() {
    return <GuideCard
        icon={<IconSessionReplay />}
        title="Session Replay"
        kind="secondary"
    >
        Visualize user interactions in your
        product with detailed session replays.
    </GuideCard>
}