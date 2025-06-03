/**
 * A string that represents a relative date value used in API queries.
 * This is an alternative to using ISO 8601 date strings.
 */
export enum RelativeDateString {
    /** Today since midnight */
    TODAY = "TODAY",

    /** Yesterday since midnight */
    YESTERDAY = "YESTERDAY",

    /** Nearest monday since midnight */
    BEGINNING_OF_WEEK = "BEGINNING_OF_WEEK",

    /** 1st of the month since midnight */
    BEGINNING_OF_MONTH = "BEGINNING_OF_MONTH",

    /** Previous 1st of the month since midnight */
    BEGINNING_OF_PREV_MONTH = "BEGINNING_OF_PREV_MONTH",

    /** Exact 7 days ago since midnight */
    TODAY_MINUS_7_DAYS = "TODAY-7DAYS",

    /** Exact 30 days ago since midnight */
    TODAY_MINUS_30_DAYS = "TODAY-30DAYS"
} 