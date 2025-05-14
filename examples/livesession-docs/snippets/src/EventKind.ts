/**
 * A numeric value that represents the type of event in the LiveSession API.
 * Each event type has a corresponding numeric identifier.
 */
export enum EventKind {
    /** Mouse click event */
    MouseClick = 5,

    /** Mouse double click event */
    MouseDoubleClick = 6,

    /** Click on error element event */
    ErrorClick = 20,

    /** Rapid click indicating user frustration */
    RageClick = 21,

    /** Console log event */
    Log = 24,

    /** JavaScript error event */
    Error = 25,

    /** Custom event */
    Custom = 26,

    /** Network log event */
    NetLog = 29,

    /** Network error event */
    NetError = 30,
}
