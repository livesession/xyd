import * as React from "react";

/*
* Props for the PageFirstSlide component.
*/
export interface PageFirstSlideProps {
    /**
     * The main content for the slide.
     */
    content?: PageFirstSlideContent;

    /**
     * Optional React node to display on the right side.
     */
    rightContent?: React.ReactNode;
}

/*
* Represents a button displayed on the first slide page.
*/
export interface PageFirstSlideButton {
    /*
    * The button label.
    */
    title: string;

    /**
     * The URL the button links to.
     */
    href: string;

    /**
     * The visual style of the button.
     */
    kind?: "primary" | "secondary";

    /**
     * Whether the button is disabled.
     */
    disabled?: boolean;
}

/*
* Content structure for the PageFirstSlide component.
*/
export interface PageFirstSlideContent {
    /**
     * The main title text.
     */
    title?: string;

    /**
     * The description text.
     */
    description?: string;

    /**
     * The primary action button.
     */
    primaryButton?: PageFirstSlideButton;

    /**
     * The secondary action button.
     */
    secondaryButton?: PageFirstSlideButton;
}

