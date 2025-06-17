import React, {useState, useRef, useEffect, createContext, useContext} from "react"
import {Tabs as RadixTabs} from "radix-ui"; // TODO: remove and use separation

import * as cn from "./TabsPrimary.styles"
import {useValueChange} from "./useValueChange";

/**
 * Context for managing the navigation direction in the TabsPrimary component
 */
const TabsPrimaryContext = createContext<{
    direction: 'forward' | 'backward'
}>({
    direction: 'forward'
});

/**
 * Props for the TabsPrimary component
 */
export interface TabsPrimaryProps {
    /** Child elements to be rendered within the navigation */
    children: React.ReactNode

    /** The currently selected tab value */
    value?: string

    /** Callback function triggered when a tab is selected */
    onChange?: (value: string) => void

    /** Whether to enable sliding animation between tabs */
    slide?: boolean

    /** Additional CSS class name for the component */
    className?: string
}

/**
 * A navigation component that displays tabs with an underline indicator
 *
 * @category Component
 */
export function TabsPrimary({
                                children,
                                value: controlledValue,
                                onChange,
                                slide = true,
                                className,
                            }: TabsPrimaryProps) {
    const childrenArray = React.Children.toArray(children);
    const navItems = childrenArray.filter(
        child => {
            return React.isValidElement(child) &&
                (child.type === TabsPrimary.Item ||
                    (typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "TabsPrimary.Item"))
        }
    );
    const otherChildren = childrenArray.filter(
        child => !React.isValidElement(child) ||
            (child.type !== TabsPrimary.Item &&
                !(typeof child.type === 'function' && 'displayName' in child.type && child.type.displayName === "TabsPrimary.Item"))
    );

    const [direction, value, handleValueChange] = useValueChange(
        controlledValue,
        onChange,
        navItems
    );

    return (
        <TabsPrimaryContext.Provider value={{direction}}>
            <RadixTabs.Root value={value} onValueChange={handleValueChange}>
                <xyd-tabs
                    className={`${cn.TabsPrimaryHost} ${className || ""}`}
                >
                    <nav part="nav">
                        <RadixTabs.List asChild>
                            <ul part="list">
                                {navItems}
                            </ul>
                        </RadixTabs.List>
                    </nav>
                    <div
                        part="content"
                        data-slide={slide ? "true" : "false"}
                    >
                        {otherChildren}
                    </div>
                </xyd-tabs>
            </RadixTabs.Root>
        </TabsPrimaryContext.Provider>
    );
}

/**
 * Props for the TabsPrimary.Item component
 */
export interface TabsPrimaryItemProps {
    /** Child elements to be rendered within the navigation item */
    children: React.ReactNode

    /** Unique identifier for the navigation item */
    value: string

    /** URL for the navigation item link */
    href?: string

    /** Custom component to render as the link element */
    as?: React.ElementType

    /** Whether this item should be active by default */
    defaultActive?: boolean
}

/**
 * Individual navigation item component
 *
 * @category Component
 */
TabsPrimary.Item = function TabsPrimaryItem({children, value, href, as, defaultActive}: TabsPrimaryItemProps) {
    const Link = as || _Link;
    const controlByItem = typeof defaultActive === "boolean"
    const [defaultActiveState, setDefaultActiveState] = useState(controlByItem ? (defaultActive ? "active" : "inactive") : undefined)

    let activeProps = controlByItem && defaultActiveState != undefined
        ? {"data-state": defaultActiveState}
        : undefined

    useEffect(() => {
        if (!controlByItem) {
            return
        }

        setDefaultActiveState(undefined)
    }, [])

    return (
        <RadixTabs.Trigger value={value} asChild {...activeProps}>
            <li part="item">
                <Link part="link" href={href}>
                    {children}
                </Link>
            </li>
        </RadixTabs.Trigger>
    );
}

/**
 * Props for the TabsPrimary.Content component
 */
export interface TabsPrimaryContentProps {
    /** Child elements to be rendered within the content area */
    children: React.ReactNode

    /** Unique identifier for the content section */
    value: string

    /** Whether this content should be active by default */
    defaultActive?: boolean
}

/**
 * Content section component for the TabsPrimary
 *
 * @category Component
 */
TabsPrimary.Content = function TabsPrimaryContent({
                                                      children,
                                                      value,
                                                      defaultActive
                                                  }: TabsPrimaryContentProps) {
    const {direction} = useContext(TabsPrimaryContext);

    const controlByItem = typeof defaultActive === "boolean"
    const [defaultActiveState, setDefaultActiveState] = useState(controlByItem ? (defaultActive ? "active" : "inactive") : undefined)

    let activeProps = controlByItem && defaultActiveState != undefined
        ? {"data-state": defaultActiveState}
        : undefined

    useEffect(() => {
        if (!controlByItem) {
            return
        }

        setDefaultActiveState(undefined)
    }, [])

    return (
        <RadixTabs.Content
            value={value}
            forceMount={true}
            asChild
            {...activeProps}
        >
            <div
                className={cn.TabsPrimaryContent}
                data-direction={direction}
            >
                <div part="child">
                    {children}
                </div>
            </div>
        </RadixTabs.Content>
    );
}

function _Link({...props}) {
    return <a {...props}>{props.children}</a>
}
