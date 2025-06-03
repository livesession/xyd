import React from "react"

import * as cn from "./Steps.styles";

/**
 * Props for the Steps component
 */
export interface StepsProps {
    /** Content to be rendered inside the steps list */
    children: React.ReactNode;

    /** Optional CSS class name to be applied to the steps container */
    className?: string;
}

/**
 * Steps component that renders a numbered list of steps or stages.
 * Use this component to display a sequence of steps in a process or workflow.
 * 
 * @category Component
 */
export function Steps({ children, className }: StepsProps) {
    return <xyd-steps>
        <ol className={`${cn.StepsHost} ${className || ""}`}>
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
    
    /** Optional CSS class name to be applied to the step item */
    className?: string;
}

/**
 * Individual step item component that represents a single step in the sequence.
 * This component should be used as a child of the Steps component.
 * 
 * @category Component
 */
Steps.Item = function StepsItem({ children, className }: StepsItemProps) {
    return <xyd-steps-item>
        <li className={`${cn.StepsLi} ${className || ""}`}>
            {children}
        </li>
    </xyd-steps-item>
}