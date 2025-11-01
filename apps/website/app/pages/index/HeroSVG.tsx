export function HeroSVG(props: React.SVGProps<SVGSVGElement>) {
    return   <svg
    width={3403}
    height={979}
    viewBox="0 0 3403 979"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <style>
      {`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        @keyframes colorShift {
          0%, 100% {
            stop-color: #096FFF;
          }
          33% {
            stop-color: #00D4FF;
          }
          66% {
            stop-color: #7B61FF;
          }
        }
        .animated-path {
          animation: dash 2s linear infinite;
        }
        .animated-stop {
          animation: colorShift 8s ease-in-out infinite;
        }
      `}
    </style>
    <path
      className="animated-path"
      d="M0.222607 0.447746C248.223 123.648 558.223 235.098 682.223 275.418C1352.84 489.728 1875.88 559.428 2368.2 563.718C2720.55 566.778 3078.33 444.513 3401.22 419.258"
      stroke="url(#paint0_linear_1_47)"
      strokeMiterlimit={10}
      strokeDasharray="12 12"
    />
    <path
      className="animated-path"
      d="M3402.22 450.366C3073.27 485.939 2715.79 655.566 2367.78 705.778C1886.21 775.248 1312.66 773.358 514.363 559.158"
      stroke="url(#paint1_linear_1_47)"
      strokeMiterlimit={10}
      strokeDasharray="12 12"
      style={{ animationDelay: '0.3s' }}
    />
    <path
      className="animated-path"
      d="M3402.22 482.172C3067.48 529.633 2710.49 749.219 2367.36 847.882C1896.37 983.323 1272.51 1057.01 346.494 842.963L346.494 842.943C317.404 834.283 209.224 798.253 9.22361 723.453"
      stroke="url(#paint2_linear_1_47)"
      strokeMiterlimit={10}
      strokeDasharray="12 12"
      style={{ animationDelay: '0.6s' }}
    />
    <defs>
      <linearGradient
        id="paint0_linear_1_47"
        x1={2045.03}
        y1={1134.95}
        x2={2058.22}
        y2={43.9475}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#011C42" />
        <stop offset={0.344133} stopColor="#096FFF" className="animated-stop" />
        <stop offset={1} stopColor="#096FFF" stopOpacity={0} className="animated-stop" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_1_47"
        x1={2045.03}
        y1={999.537}
        x2={2045.03}
        y2={317.878}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#011C42" />
        <stop offset={0.344133} stopColor="#096FFF" className="animated-stop" style={{ animationDelay: '1s' }} />
        <stop offset={1} stopColor="#096FFF" stopOpacity={0} className="animated-stop" style={{ animationDelay: '1s' }} />
      </linearGradient>
      <linearGradient
        id="paint2_linear_1_47"
        x1={2045.03}
        y1={999.543}
        x2={2045.03}
        y2={317.883}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#011C42" />
        <stop offset={0.344133} stopColor="#096FFF" className="animated-stop" style={{ animationDelay: '2s' }} />
        <stop offset={1} stopColor="#096FFF" stopOpacity={0} className="animated-stop" style={{ animationDelay: '2s' }} />
      </linearGradient>
    </defs>
  </svg>
}