import React, {createContext, ReactElement, SVGProps, use} from "react";
import parse from 'html-react-parser';

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
    const {name, size = 24, color} = props

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


