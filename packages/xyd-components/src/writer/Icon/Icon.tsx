import React, { createContext, ReactElement, SVGProps, use } from "react";
import parse from 'html-react-parser';

import * as cn from "./Icon.styles"
// TODO: html-react-parser is not the best choice, but it works for now

export const IconProvider = createContext({
    iconSet: {}
})

interface IconProps {
    name: string;
    size?: number;
    color?: string;
}

export function Icon(props: IconProps): ReactElement | null {
    const { name, size = 24, color } = props

    const iconProvider = use(IconProvider)
    const iconSet = iconProvider?.iconSet

    if (!iconSet) {
        return null
    }

    const ico = iconSet[name]
    if (!ico || !ico.svg) {
        return null
    }

    const icon = parse(ico.svg) as ReactElement<SVGProps<SVGSVGElement>>
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
            width: size,
            height: size,
            color: color || icon.props.color || 'currentColor',
            style: {
                width: size,
                height: size,
                color: color || icon.props.color || 'currentColor',
            }
        })
    }

    return null
}

Icon.ExternalArrow = function ExternalArrow() {
    return <svg
        className={cn.ExternalArrowHost}
        aria-hidden="true"
        viewBox="0 0 6 6"
    >
        <path
            d="M1.25215 5.54731L0.622742 4.9179L3.78169 1.75597H1.3834L1.38936 0.890915H5.27615V4.78069H4.40513L4.41109 2.38538L1.25215 5.54731Z"
            fill="var(--accents-3)"
        />
    </svg>
}