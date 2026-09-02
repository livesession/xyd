import React from "react"

import * as cn from "./CodeTutorialSteps.styles";

/**
 * Props for the CodeTutorialSteps component
 */
export interface CodeTutorialStepsProps {
    /** Steps to be rendered - one `CodeTutorialSteps.Step` per numbered step */
    children: React.ReactNode;

    /** Optional CSS class name to be applied to the tutorial container */
    className?: string;
}

/**
 * CodeTutorialSteps component that renders a numbered vertical stepper whose body is
 * split in two: prose on the left and the code or callouts it produces on the right.
 * Use it for programmatic quickstarts - for a plain sequence of instructions use `Steps`.
 *
 * @category Component
 */
export function CodeTutorialSteps({ children, className }: CodeTutorialStepsProps) {
    const blocks: React.ReactNode[] = []
    let items: React.ReactNode[] = []
    let step = 0

    // an `ol` may only contain `li`, so anything that is not a step ends the run
    // instead of being smuggled into the list - `start` carries the numbering over
    function flushItems() {
        if (!items.length) {
            return
        }

        blocks.push(
            <ol key={`steps-${step}`} role="list" start={step - items.length + 1}>
                {items}
            </ol>
        )
        items = []
    }

    React.Children.forEach(children, (child, index) => {
        if (React.isValidElement(child) && child.type === CodeTutorialSteps.Step) {
            step++

            items.push(React.cloneElement(
                child as React.ReactElement<CodeTutorialStepProps>,
                { key: `step-${index}`, step }
            ))
            return
        }

        flushItems()
        blocks.push(<React.Fragment key={`block-${index}`}>{child}</React.Fragment>)
    })
    flushItems()

    return <div className={`${cn.CodeTutorialStepsHost} ${className || ""}`}>
        {blocks}
    </div>
}

/**
 * Props for the CodeTutorialSteps.Step component
 */
export interface CodeTutorialStepProps {
    /** Slots of the step - a `Title`, a `Body` and an optional `Aside` */
    children: React.ReactNode;

    /** Position of the step, 1-based. Injected by `CodeTutorialSteps` */
    step?: number;

    /** Optional CSS class name to be applied to the step */
    className?: string;
}

/**
 * A single step of a code tutorial. This component should be used as a child of
 * the CodeTutorialSteps component.
 *
 * @category Component
 */
CodeTutorialSteps.Step = function CodeTutorialStep({ children, step, className }: CodeTutorialStepProps) {
    return <li className={`${cn.CodeTutorialStepsItem} ${className || ""}`}>
        {/* the `ol` already tells assistive tech which step this is - the badge repeats it visually */}
        <span part="marker" aria-hidden="true">{step}</span>

        {children}
    </li>
}

/**
 * Heading of a step. Rendered as text rather than a heading element on purpose:
 * a step sits under the page `h1` and would read as a level skip.
 *
 * @category Component
 */
CodeTutorialSteps.Title = function CodeTutorialStepTitle({ children }: { children: React.ReactNode }) {
    return <div part="title">
        {children}
    </div>
}

/**
 * Left column of a step - the explanation.
 *
 * @category Component
 */
CodeTutorialSteps.Body = function CodeTutorialStepBody({ children }: { children: React.ReactNode }) {
    return <div part="body">
        {children}
    </div>
}

/**
 * Right column of a step - the code blocks and callouts the explanation refers to.
 *
 * @category Component
 */
CodeTutorialSteps.Aside = function CodeTutorialStepAside({ children }: { children: React.ReactNode }) {
    return <div part="aside">
        {children}
    </div>
}
