import React, {createContext, ReactElement, SVGProps, use} from "react";
import parse, { HTMLReactParserOptions, Element } from "html-react-parser";

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

    const icon = parseIcon(ico.svg) as ReactElement<SVGProps<SVGSVGElement>>

    if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
            width: size,
            height: size,
            color: color || icon.props.color || 'currentColor',
            fill: color || icon.props.fill || 'currentColor',
            style: {
                width: size,
                height: size,
                color: color || icon.props.color || 'currentColor',
                fill: color || icon.props.color || 'currentColor',
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


function parseIcon(svg: string) {
    const options: HTMLReactParserOptions = {
      htmlparser2: { xmlMode: true }, // preserves case of *attributes*, still lowercase tags
      replace(domNode) {
        if (domNode.type === "tag") {
          const el = domNode as Element;
  
          // ✅ Fix tag name casing
          if (el.name === "lineargradient") el.name = "linearGradient";
          if (el.name === "radialgradient") el.name = "radialGradient";
          if (el.name === "clippath") el.name = "clipPath";
          if (el.name === "pattern") el.name = "pattern"; // example: stays same
  
          // ✅ Fix attribute casing for React
          const attrs = el.attribs || {};
          if ("stop-color" in attrs) {
            attrs.stopColor = attrs["stop-color"];
            delete attrs["stop-color"];
          }
          if ("fill-rule" in attrs) {
            attrs.fillRule = attrs["fill-rule"];
            delete attrs["fill-rule"];
          }
          if ("clip-rule" in attrs) {
            attrs.clipRule = attrs["clip-rule"];
            delete attrs["clip-rule"];
          }
        }
        return domNode;
      },
    };
  
    return parse(svg, options);
  }