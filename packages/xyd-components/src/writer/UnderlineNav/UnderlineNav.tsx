import React, { useState, useRef, useEffect, createContext, useContext } from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./UnderlineNav.styles"

const UnderlineContext = createContext<{
    direction: 'forward' | 'backward'
}>({
    direction: 'forward'
});

export interface TabsProps {
    children: React.ReactNode
    value?: string
    onChange?: (value: string) => void
    slide?: boolean
    className?: string
}

export function UnderlineNav({
    children,
    value: controlledValue,
    onChange,
    slide = true,
    className
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
                <xyd-underlinenav className={`${cn.UnderlineNavHost} ${className || ""}`} >
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

export interface UnderlineNavItemProps {
    children: React.ReactNode
    value: string
    href?: string
    as?: React.ElementType
    defaultActive?: boolean
}

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

export interface UnderlineNavContentProps {
    children: React.ReactNode
    value: string
    defaultActive?: boolean
}

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

// Custom hook to handle value changes and direction
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

function $Link({ ...props }) {
    return <a {...props}>{props.children}</a>
}