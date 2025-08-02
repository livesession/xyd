import React, {useRef, useState} from "react";
import { useTabsAnalytics } from "./TabsAnalytics";

/**
 * Custom hook to handle value changes and determine navigation direction
 * @param controlledValue - The controlled value from props
 * @param onChange - Callback function for value changes
 * @param navItems - Array of navigation items
 * @returns Tuple containing direction, current value, and change handler
 */
export function useValueChange(
    controlledValue: string | undefined,
    onChange: ((value: string) => void) | undefined,
    navItems: React.ReactNode[],
) {
    const tabsAnalytics = useTabsAnalytics()
    const tabsRef = tabsAnalytics.tabsRef
    
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
        const newDirection = newIndex > currentIndex ? 'forward' : 'backward';
        setDirection(newDirection);

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

        // Dispatch custom event if tabsRef is provided
        if (tabsRef?.current) {
            const eventData = {
                value: newValue,
                previousValue: prevValueRef.current,
                direction: newDirection as 'forward' | 'backward'
            };
            
            const tabChangeEvent = new CustomEvent('components.tabs.change', {
                detail: eventData,
                bubbles: true
            });
            tabsRef.current.dispatchEvent(tabChangeEvent);
        }
    };

    return [direction, value, handleValueChange] as const;
}

