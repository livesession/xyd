import React from 'react'
import { gsap } from 'gsap'

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

interface State {
  dotPosition: { x: number; y: number }
  pathLength: number
  dotRadius: number
  gradientWidthScaleFactor: number
}

export class SvgNode extends React.Component<SvgNodeProps, State> {
  private pathElement: SVGPathElement | null = null
  private pathId: string = Math.random().toString(36)
  private animationState = {
    dotRadius: 0,
    gradientWidthScaleFactor: 0
  }

  constructor(props: SvgNodeProps) {
    super(props)
    this.state = {
      dotPosition: { x: 0, y: 0 },
      pathLength: 0,
      dotRadius: props.visible ? 3 : 0,
      gradientWidthScaleFactor: props.visible ? 1 : 0
    }
    this.animationState = {
      dotRadius: props.visible ? 3 : 0,
      gradientWidthScaleFactor: props.visible ? 1 : 0
    }
  }

  componentDidMount() {
    if (this.pathElement) {
      this.setState({ pathLength: this.pathElement.getTotalLength() })
      this.updateDotPosition()
    }
  }

  componentDidUpdate(prevProps: SvgNodeProps) {
    if (prevProps.position !== this.props.position) {
      this.updateDotPosition()
    }

    if (prevProps.visible !== this.props.visible) {
      // Create a GSAP timeline for coordinated animations
      const tl = gsap.timeline()
      
      // Animate gradient width scale factor
      tl.to(this.animationState, {
        duration: 0.5,
        ease: 'power2.inOut',
        gradientWidthScaleFactor: this.props.visible ? 1 : 0,
        onUpdate: () => {
          this.setState({
            gradientWidthScaleFactor: this.animationState.gradientWidthScaleFactor
          })
        }
      }, 0)
      
      // Animate dot radius
      tl.to(this.animationState, {
        duration: 0.6,
        ease: 'power2.inOut',
        dotRadius: this.props.visible ? 3 : 0,
        onUpdate: () => {
          this.setState({
            dotRadius: this.animationState.dotRadius
          })
        }
      }, 0)
    }
  }

  private updateDotPosition = () => {
    if (!this.pathElement) return
    const position = (1 - (this.props.position || 0)) * this.state.pathLength
    const { x, y } = this.pathElement.getPointAtLength(position)
    this.setState({ dotPosition: { x, y } })
  }

  render() {
    const { path, label, labelVisible, dotColor, glowColor } = this.props
    const { dotPosition, dotRadius, gradientWidthScaleFactor } = this.state

    return (
      <g>
        <path
          ref={(el) => {
            this.pathElement = el
          }}
          d={path}
          stroke={`url(#glow_gradient_${this.pathId})`}
          strokeWidth="1.2"
          mask={`url(#glow_mask_${this.pathId})`}
          className="svg-path"
        />
        {dotColor && (
          <circle
            cx={dotPosition.x}
            cy={dotPosition.y}
            r={dotRadius}
            fill={typeof dotColor === 'string' ? dotColor : 'transparent'}
            className="circle-dot"
            style={{ '--dot-color': typeof dotColor === 'string' ? dotColor : 'white' } as React.CSSProperties}
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
            className={`label ${labelVisible ? 'label--visible' : ''}`}
          >
            {label}
          </text>
        )}
        <defs>
          <mask id={`glow_mask_${this.pathId}`}>
            <path d={path} fill="black" />
            <circle
              cx={dotPosition.x}
              cy={dotPosition.y}
              r={30 * gradientWidthScaleFactor}
              fill="white"
            />
          </mask>
          <radialGradient
            id={`glow_gradient_${this.pathId}`}
            cx={dotPosition.x}
            cy={dotPosition.y}
            r={30 * gradientWidthScaleFactor}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={glowColor} stopOpacity="1" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>
      </g>
    )
  }
}
