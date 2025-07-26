import React from "react"

import * as cn from "./Steps.styles";
import { Icon } from "../Icon"

/**
 * Props for the Steps component
 */
export interface StepsProps {
    /** Content to be rendered inside the steps list */
    children: React.ReactNode;

    /** Optional CSS class name to be applied to the steps container */
    className?: string;

    /** Optional kind of steps to be rendered */
    kind?: "secondary" | undefined;
}

/**
 * Steps component that renders a numbered list of steps or stages.
 * Use this component to display a sequence of steps in a process or workflow.
 * 
 * @category Component
 */
export function Steps({ children, className, kind }: StepsProps) {
    return <xyd-steps
        data-kind={kind}
        className={`${cn.StepsHost} ${className || ""}`}
    >
        <ol>
            {children}
        </ol>
    </xyd-steps>
}

/**
 * Props for the Steps.Item component
 */
export interface StepsItemProps {
    /** Content to be rendered inside the step item */
    children: React.ReactNode;

    /** Optional icon to be displayed in the step item */
    icon?: string | React.ReactNode;

    /** Optional title to be displayed in the step item */
    title?: string;

    /** Optional CSS class name to be applied to the step item */
    className?: string;
}

/**
 * Individual step item component that represents a single step in the sequence.
 * This component should be used as a child of the Steps component.
 * 
 * @category Component
 */
Steps.Item = function StepsItem({ children, icon, title, className }: StepsItemProps) {
    const iconElement = typeof icon === "string" ? <Icon name={icon} /> : icon;

    return <xyd-steps-item
        className={`${cn.StepsItem} ${className || ""}`}
        data-numeric={!icon ? "true" : undefined}
    >
        <li>
            {title && <span part="title">{title}</span>}

            {children}

            {iconElement && <span part="step">{iconElement}</span>}
        </li>
    </xyd-steps-item>
}