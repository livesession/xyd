import React, { useState, useRef, useEffect, createContext, useContext } from "react"
import {Tabs as RadixTabs} from "radix-ui"; // TODO: remove and use separation

import * as cn from "./UnderlineNav.styles"

/**
 * Context for managing the navigation direction in the UnderlineNav component
 */
const UnderlineContext = createContext<{
    direction: 'forward' | 'backward'
}>({
    direction: 'forward'
});

/**
 * Props for the UnderlineNav component
 */§
export interface TabsProps {
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

    /** The variant of the navigation */
    kind?: 'default' | 'secondary'
}

/**
 * A navigation component that displays tabs with an underline indicator
 * 
 * @category Component
 */
export function UnderlineNav({
    children,
    value: controlledValue,
    onChange,
    slide = true,
    className,
    kind = 'default'
}: TabsProps) {
    const childrenArray = React.Children.toArray(children);
    const navItems = childrenArray.filter(
        child => {
            return React.isValidElement(child) &&
                (child.type === UnderlineNav.Item || child.type.displayName === "UnderlineNav.Item")
        }
    );
    const otherChildren = childrenArray.filter(
        child => !React.isValidElement(child) ||
            (child.type !== UnderlineNav.Item && child.type.displayName !== "UnderlineNav.Item")
    );

    const [direction, value, handleValueChange] = useValueChange(
        controlledValue,
        onChange,
        navItems
    );

    return (
        <UnderlineContext.Provider value={{ direction }}>
            <RadixTabs.Root value={value} onValueChange={handleValueChange}>
                <xyd-underlinenav 
                    className={`${cn.UnderlineNavHost} ${className || ""}`}
                    data-kind={kind}
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
                </xyd-underlinenav>
            </RadixTabs.Root>
        </UnderlineContext.Provider>
    );
}

/**
 * Props for the UnderlineNav.Item component
 */
export interface UnderlineNavItemProps {
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
UnderlineNav.Item = function UnderlineNavItem({ children, value, href, as, defaultActive }: UnderlineNavItemProps) {
    const Link = as || $Link;
    const controlByItem = typeof defaultActive === "boolean"
    const [defaultActiveState, setDefaultActiveState] = useState(controlByItem ? (defaultActive ? "active" : "inactive") : undefined)

    let activeProps = controlByItem && defaultActiveState != undefined
        ? { "data-state": defaultActiveState }
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
 * Props for the UnderlineNav.Content component
 */
export interface UnderlineNavContentProps {
    /** Child elements to be rendered within the content area */
    children: React.ReactNode

    /** Unique identifier for the content section */
    value: string

    /** Whether this content should be active by default */
    defaultActive?: boolean
}

/**
 * Content section component for the UnderlineNav
 * 
 * @category Component
 */
UnderlineNav.Content = function UnderlineNavContent({
    children,
    value,
    defaultActive
}: UnderlineNavContentProps) {
    const { direction } = useContext(UnderlineContext);

    const controlByItem = typeof defaultActive === "boolean"
    const [defaultActiveState, setDefaultActiveState] = useState(controlByItem ? (defaultActive ? "active" : "inactive") : undefined)

    let activeProps = controlByItem && defaultActiveState != undefined
        ? { "data-state": defaultActiveState }
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
            <xyd-underlinenav-content
                className={cn.UnderlineNavContent}
                data-direction={direction}
            >
                <div part="child">
                    {children}
                </div>
            </xyd-underlinenav-content>
        </RadixTabs.Content>
    );
}

/**
 * Custom hook to handle value changes and determine navigation direction
 * @param controlledValue - The controlled value from props
 * @param onChange - Callback function for value changes
 * @param navItems - Array of navigation items
 * @returns Tuple containing direction, current value, and change handler
 */
function useValueChange(
    controlledValue: string | undefined,
    onChange: ((value: string) => void) | undefined,
    navItems: React.ReactNode[]
) {
    // Determine if we're in controlled or uncontrolled mode
    const isControlled = controlledValue !== undefined && onChange !== undefined;

    // For uncontrolled mode, use internal state
    const [internalValue, setInternalValue] = useState(
        navItems.length > 0 && React.isValidElement(navItems[0]) ?
            navItems[0].props.value : ''
    );

    // Use either controlled or internal value
    const value = isControlled ? controlledValue : internalValue;

    // Track previous value to determine navigation direction
    const prevValueRef = useRef(value);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

    // Handle value change and determine direction
    const handleValueChange = (newValue: string) => {
        // Find indices of current and new values
        const currentIndex = navItems.findIndex(
            item => React.isValidElement(item) && item.props.value === prevValueRef.current
        );
        const newIndex = navItems.findIndex(
            item => React.isValidElement(item) && item.props.value === newValue
        );

        // Set direction based on indices
        setDirection(newIndex > currentIndex ? 'forward' : 'backward');

        // Update previous value
        prevValueRef.current = newValue;

        // Update internal state if uncontrolled
        if (!isControlled) {
            setInternalValue(newValue);
        }

        // Call the original onChange if provided
        if (onChange) {
            onChange(newValue);
        }
    };

    return [direction, value, handleValueChange] as const;
}

/**
 * Default link component used when no custom link component is provided
 * @param props - The component props
 * @returns A React component
 */
function $Link({ ...props }) {
    return <a {...props}>{props.children}</a>
}