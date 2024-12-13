import React, {useState, useEffect} from "react"

export interface CodeTabsProps {
    $localStorageKey: string
    $defaultValue: string

    children: React.ReactNode
}

// TODO: interface
export function withLocalStored(Component: any) {
    return function LocalStored(props: CodeTabsProps) {
        const [value, setValue] = useState(
            typeof localStorage !== "undefined"
                ? localStorage?.getItem(props.$localStorageKey) || props.$defaultValue
                : props.$defaultValue,
        )

        useEffect(() => {
            const handler = (e: StorageEvent) => {
                if (e.key === props.$localStorageKey) {
                    setValue(e.newValue || props.$defaultValue)
                }
            }
            window.addEventListener("storage", handler)
            return () => {
                window.removeEventListener("storage", handler)
            }
        }, [props.$localStorageKey])

        function onValueChange(value: string) {
            localStorage.setItem(props.$localStorageKey, value)
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: props.$localStorageKey,
                    newValue: value,
                }),
            )
        }

        return (
            <Component
                onValueChange={onValueChange}
                value={value}
            >
                {props.children}
            </Component>
        )
    }
}
