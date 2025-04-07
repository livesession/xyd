import React, {useEffect, useRef, useState} from 'react'
import {gsap} from 'gsap'

import styles from "./HeroDiagram.module.css"

/**
 * A single glowing "node" (dot) on an SVG path.
 */
export interface SvgNodeProps {
    /**
     * The SVG path to draw the node on.
     */
    path: string

    /**
     * The position of the node along the path, represented as a percentage from 0-1.
     */
    position?: number

    /**
     * Whether the node is visible or not.
     */
    visible?: boolean

    /**
     * Whether the node label is visible or not.
     */
    labelVisible?: boolean

    /**
     * The label to display next to the node.
     */
    label?: string

    /**
     * The color of the glow effect.
     */
    glowColor?: string

    /**
     * The color of the dot.
     */
    dotColor?: string | boolean
}

export const SvgNode: React.FC<SvgNodeProps> = ({
                                                    path,
                                                    position = 0,
                                                    visible = false,
                                                    labelVisible = false,
                                                    label,
                                                    dotColor,
                                                    glowColor
                                                }) => {
    const pathElementRef = useRef<SVGPathElement>(null)
    const pathId = useRef(Math.random().toString(36))
    const animationStateRef = useRef({
        dotRadius: visible ? 3 : 0,
        gradientWidthScaleFactor: visible ? 1 : 0
    })

    const [dotPosition, setDotPosition] = useState({x: 0, y: 0})
    const [pathLength, setPathLength] = useState(0)
    const [dotRadius, setDotRadius] = useState(visible ? 3 : 0)
    const [gradientWidthScaleFactor, setGradientWidthScaleFactor] = useState(visible ? 1 : 0)

    const updateDotPosition = () => {
        if (!pathElementRef.current) return
        const pos = (1 - position) * pathLength
        const {x, y} = pathElementRef.current.getPointAtLength(pos)
        setDotPosition({x, y})
    }

    useEffect(() => {
        if (pathElementRef.current) {
            setPathLength(pathElementRef.current.getTotalLength())
            updateDotPosition()
        }
    }, [])

    useEffect(() => {
        updateDotPosition()
    }, [position, pathLength])

    useEffect(() => {
        const tl = gsap.timeline()

        // Animate gradient width scale factor
        tl.to(animationStateRef.current, {
            duration: 0.5,
            ease: 'power2.inOut',
            gradientWidthScaleFactor: visible ? 1 : 0,
            onUpdate: () => {
                setGradientWidthScaleFactor(animationStateRef.current.gradientWidthScaleFactor)
            }
        }, 0)

        // Animate dot radius
        tl.to(animationStateRef.current, {
            duration: 0.6,
            ease: 'power2.inOut',
            dotRadius: visible ? 3 : 0,
            onUpdate: () => {
                setDotRadius(animationStateRef.current.dotRadius)
            }
        }, 0)
    }, [visible])

    return (
        <g>
            <path
                ref={pathElementRef}
                d={path}
                stroke={`url(#glow_gradient_${pathId.current})`}
                strokeWidth="1.2"
                mask={`url(#glow_mask_${pathId.current})`}
                className={styles.SvgPath}
            />
            {dotColor && (
                <circle
                    cx={dotPosition.x}
                    cy={dotPosition.y}
                    r={dotRadius}
                    fill={typeof dotColor === 'string' ? dotColor : 'transparent'}
                    className={styles.CircleDot}
                    style={{'--dot-color': typeof dotColor === 'string' ? dotColor : 'white'} as React.CSSProperties}
                />
            )}
            {label && (
                <text
                    x={dotPosition.x}
                    y={dotPosition.y + 15}
                    fill="#a3a3a3"
                    fontFamily="Inter, sans-serif"
                    fontSize="11px"
                    fontStyle="normal"
                    fontWeight="400"
                    textAnchor="middle"
                    alignmentBaseline="hanging"
                    className={`${styles.Label} ${labelVisible ? styles.Label__visible : ''}`}
                >
                    {label}
                </text>
            )}
            <defs>
                <mask id={`glow_mask_${pathId.current}`}>
                    <path d={path} fill="black"/>
                    <circle
                        cx={dotPosition.x}
                        cy={dotPosition.y}
                        r={30 * gradientWidthScaleFactor}
                        fill="white"
                    />
                </mask>
                <radialGradient
                    id={`glow_gradient_${pathId.current}`}
                    cx={dotPosition.x}
                    cy={dotPosition.y}
                    r={30 * gradientWidthScaleFactor}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor={glowColor} stopOpacity="1"/>
                    <stop offset="100%" stopColor={glowColor} stopOpacity="0"/>
                </radialGradient>
            </defs>
        </g>
    )
}
