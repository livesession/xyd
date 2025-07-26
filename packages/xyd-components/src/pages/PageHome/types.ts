import { GuideCardProps } from "../../writer/GuideCard/GuideCard";

/**
 * Props for the PageHome component.
 */
export interface PageHomeProps {
    /**
     * Hero section content for the home page.
     */
    hero?: PageHomeHero;

    /**
     * Sections to display on the home page.
     */
    sections?: PageHomeSection[];
}

/**
 * Button used in the hero section of the home page.
 */
export interface PageHomeHeroButton {
    /**
     * The button label.
     */
    title: string;

    /**
     * The URL the button links to.
     */
    href: string;
}

/**
 * Hero section content for the home page.
 */
export interface PageHomeHero {
    /**
     * The main title text.
     */
    title?: string;

    /**
     * The description text.
     */
    description?: string;

    /**
     * The image URL for the hero section.
     */
    image?: string;

    /**
     * The main button for the hero section.
     */
    button?: PageHomeHeroButton;
}

/**
 * Card displayed in a section on the home page. Extends GuideCardProps.
 */
export interface PageHomeCard extends GuideCardProps {

}

/**
 * Section displayed on the home page.
 */
export interface PageHomeSection {
    /**
     * The section title.
     */
    title?: string;
    
    /**
     * Cards to display in the section.
     */
    cards?: PageHomeCard[];
}

