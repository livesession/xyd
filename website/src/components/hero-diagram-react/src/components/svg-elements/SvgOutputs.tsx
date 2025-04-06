import { SvgNode, SvgNodeProps } from '../common/SvgNode'

interface SvgOutputsProps {
  outputLines: { current: SvgNodeProps }[]
}

export function SvgOutputs({ outputLines }: SvgOutputsProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="844"
      height="80"
      viewBox="0 0 844 40"
      fill="none"
      className="output-line"
      style={{ opacity: 0.8 }}
    >
      <path
        d="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
        stroke="url(#output_gradient)"
        strokeWidth="1.2"
      />
      {outputLines.map((outputLine, index) => (
        <SvgNode
          key={index}
          path={outputLine.current.path}
          position={outputLine.current.position}
          visible={outputLine.current.visible}
          labelVisible={outputLine.current.labelVisible}
          label={outputLine.current.label}
          dotColor={outputLine.current.dotColor}
          glowColor={outputLine.current.glowColor}
        />
      ))}
      <defs>
        <linearGradient id="output_gradient" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#E0C8FF" stopOpacity="0" />
          <stop offset="0.4" stopColor="#E0C8FF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#E0C8FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// // Add the CSS styles
// const styles = `
// .output-line {
//   position: absolute;
//   top: 300px;
//   left: 785px;
//   transform: translate3d(0, 0, 0);
// }
// `

// // Add the styles to the document
// const styleSheet = document.createElement('style')
// styleSheet.innerText = styles
// document.head.appendChild(styleSheet)