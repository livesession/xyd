import React, {forwardRef} from 'react'
import type {ComponentProps, ReactNode} from 'react'
import cn from 'clsx'
import {tv} from "tailwind-variants";

type InputProps = ComponentProps<'input'> & { suffix?: ReactNode }

const styled = tv({
    slots: {
        container: "relative flex items-center text-gray-900 contrast-more:text-gray-800 dark:text-gray-300 contrast-more:dark:text-gray-300",
        input: cn(
            'block w-full appearance-none rounded-lg px-3 py-2 transition-colors',
            'text-base leading-tight md:text-sm',
            'bg-black/[.05] dark:bg-gray-50/10',
            'focus:bg-white dark:focus:bg-dark',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'contrast-more:border contrast-more:border-current'
        )
    }
})

export const HInput = forwardRef<HTMLInputElement, InputProps>(
    ({className, suffix, ...props}, forwardedRef) => {

        const {container, input} = styled()

        return <div
            className={container()}>
            <input
                ref={forwardedRef}
                spellCheck={false}
                className={input({class: className})}
                {...props}
            />
            {suffix}
        </div>
    }
)

HInput.displayName = 'Input'
