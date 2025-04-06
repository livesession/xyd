import React from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SvgInputs } from './svg-elements/SvgInputs'
import { SvgOutputs } from './svg-elements/SvgOutputs'
import { SvgBlueIndicator } from './svg-elements/SvgBlueIndicator'
import { SvgPinkIndicator } from './svg-elements/SvgPinkIndicator'
import { SvgNodeProps } from './common/SvgNode'

import './styles.css'

// Register both plugins with GSAP
gsap.registerPlugin(MotionPathPlugin, ScrollTrigger)

// Define the paths on the input side of the diagram
const inputPaths = [
  'M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011',
  'M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892',
  'M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071',
  'M843.505 325.224L598.822 326.002L0.675049 321.858',
  'M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646',
  'M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825',
  'M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717',
]

// Define the file set "combinations" that can be shown on the input side
const inputFileSets = [
  [
    { label: 'graphql', color: '#61dafb' },
    { label: 'openapi', color: '#cc6699' },
    { label: 'typedoc', color: '#ff3e00' },
  ],
  [
    { label: 'go', color: '#3178c6' },
    { label: 'node', color: '#cc6699' },
    { label: 'python', color: '#42b883' },
  ],
  [
    { label: 'storybook', color: '#f7df1e' },
    { label: 'npm', color: '#264de4' },
    { label: 'github', color: '#e34c26' },
  ],
  [
    { label: 'llm.txt', color: '#3178c6' },
    { label: 'openai', color: '#1d365d' },
    { label: 'anthropic', color: '#ff5d01' },
  ]
]

interface State {
  blueIndicator: boolean
  pinkIndicator: boolean
  illuminateLogo: boolean
  isUwu: boolean
  isChromiumBrowser: boolean
  inputLines: SvgNodeProps[]
  outputLines: SvgNodeProps[]
}

export default class HeroDiagram extends React.Component<{}, State> {
  private timeline: gsap.core.Timeline | null = null
  private scrollTriggerInstance: ScrollTrigger | null = null

  constructor(props: {}) {
    super(props)
    this.state = {
      blueIndicator: false,
      pinkIndicator: false,
      illuminateLogo: false,
      isUwu: window.location.search.includes('?uwu'),
      isChromiumBrowser: 'chrome' in window,
      inputLines: inputPaths.map((path) => ({
        position: 0,
        visible: false,
        labelVisible: false,
        label: '',
        dotColor: undefined,
        glowColor: undefined,
        path,
      })),
      outputLines: [
        {
          position: 0,
          visible: false,
          labelVisible: false,
          label: 'sdks',
          path: 'M843.463 1.3315L245.316 5.47507L0.633077 4.69725',
          dotColor: '#d499ff',
          glowColor: '#BD34FE'
        },
        {
          position: 0,
          visible: false,
          labelVisible: false,
          label: 'docs',
          path: 'M843.463 1.3315L245.316 5.47507L0.633077 4.69725',
          dotColor: '#d499ff',
          glowColor: '#BD34FE'
        },
        // {
        //   position: 0,
        //   visible: false,
        //   labelVisible: false,
        //   label: '.js',
        //   path: 'M843.463 1.3315L245.316 5.47507L0.633077 4.69725',
        //   dotColor: '#d499ff',
        //   glowColor: '#BD34FE'
        // },
      ],
    }
  }

  componentDidMount() {
    // Register plugins at component level to ensure they're available
    // gsap.registerPlugin(MotionPathPlugin, ScrollTrigger)

    // Create a single timeline that persists
    this.timeline = gsap.timeline({
      repeat: -1, // Infinite repeat
    })

    // Start the animation
    this.animateDiagram()

    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: '#hero-diagram',
      start: 'center 100%',
      once: true,
      onEnter: () => {
        if (this.timeline) {
          this.timeline.play()
        }
      },
    })
  }

  componentWillUnmount() {
    this.scrollTriggerInstance?.kill()
    this.timeline?.kill()
  }

  private prepareInputs = () => {
    // Randomly select a set of input file "nodes"
    const inputFileSet =
      inputFileSets[Math.floor(Math.random() * inputFileSets.length)]

    // Choose 3 unique lines for the input file nodes to slide along
    const inputLineIndexes = new Set()
    while (inputLineIndexes.size < inputFileSet.length) {
      const index = Math.floor(Math.random() * this.state.inputLines.length)
      inputLineIndexes.add(index)
    }

    // Assign each line its appropriate node label and colors
    const newInputLines = [...this.state.inputLines]
    const inputs = [...inputLineIndexes]
    inputs.forEach((lineIndex, fileIndex) => {
      if (fileIndex < inputFileSet.length) {
        const line = newInputLines[lineIndex as number]
        line.label = inputFileSet[fileIndex].label
        line.dotColor = inputFileSet[fileIndex].color
        line.glowColor = inputFileSet[fileIndex].color
        line.path = inputPaths[lineIndex as number]
      }
    })
    this.setState({ inputLines: newInputLines })
    return inputs
  }

  private animateSingleInputDesktop = (inputLine: SvgNodeProps) => {
    const timeline = gsap.timeline()

    // Reset the line
    timeline.set(
      inputLine,
      {
        position: 0,
        visible: false,
        labelVisible: false,
      },
      0
    )

    // Animate the dot in
    timeline.to(
      inputLine,
      {
        position: Math.random() * 0.1 + 0.4,
        duration: 1,
        ease: 'expo.out',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      0
    )

    // Show the dot
    timeline.set(
      inputLine,
      {
        visible: true,
      },
      0
    )

    // Show the label
    timeline.set(
      inputLine,
      {
        labelVisible: true,
      },
      0.2
    )

    // Animate the dot out
    timeline.to(
      inputLine,
      {
        position: 1,
        duration: 1.2,
        ease: 'power3.in',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      1.2
    )

    // Hide the label
    timeline.set(
      inputLine,
      {
        labelVisible: false,
      },
      1.6
    )

    // Hide the dot
    timeline.set(
      inputLine,
      {
        visible: false,
      },
      1.9
    )

    return timeline
  }

  private animateSingleOutputDesktop = (
    outputLine: SvgNodeProps,
    index: number
  ) => {
    const timeline = gsap.timeline()

    // Reset the line
    timeline.set(
      outputLine,
      {
        position: 0,
        visible: false,
        labelVisible: false,
      },
      0
    )

    // Animate the dot in
    timeline.to(
      outputLine,
      {
        position: (0.7 / 3) * (index + 1) + 0.05,
        duration: 1.5,
        ease: 'expo.out',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      0
    )

    // Show the dot
    timeline.set(
      outputLine,
      {
        visible: true,
      },
      0
    )

    // Show the label
    timeline.set(
      outputLine,
      {
        labelVisible: true,
      },
      0.4
    )

    // Animate the dot out
    timeline.to(
      outputLine,
      {
        position: 1,
        duration: 1.5,
        ease: 'power3.in',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      2
    )

    // Hide the label
    timeline.set(
      outputLine,
      {
        labelVisible: false,
      },
      2.5
    )

    // Hide the dot
    timeline.set(
      outputLine,
      {
        visible: false,
      },
      3
    )

    return timeline
  }

  private animateSingleInputMobile = (inputLine: SvgNodeProps) => {
    const timeline = gsap.timeline()

    // Reset the line
    timeline.set(
      inputLine,
      {
        position: 0,
        visible: false,
        labelVisible: false,
      },
      0
    )

    // Animate the dot in
    timeline.to(
      inputLine,
      {
        position: 1,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      0
    )

    // Show the dot
    timeline.set(
      inputLine,
      {
        visible: true,
      },
      0
    )

    // Hide the dot
    timeline.set(
      inputLine,
      {
        visible: false,
      },
      0.5
    )

    return timeline
  }

  private animateSingleOutputMobile = (outputLine: SvgNodeProps) => {
    const timeline = gsap.timeline()

    // Reset the line
    timeline.set(
      outputLine,
      {
        position: 0,
        visible: false,
        labelVisible: false,
      },
      0
    )

    // Animate the dot in
    timeline.to(
      outputLine,
      {
        position: 0.7,
        duration: 2,
        ease: 'power1.inOut',
        onUpdate: () => {
          // Force a re-render on each frame
          this.forceUpdate()
        }
      },
      0.3
    )

    // Show the dot
    timeline.set(
      outputLine,
      {
        visible: true,
      },
      0.75
    )

    // Hide the dot
    timeline.set(
      outputLine,
      {
        visible: false,
      },
      1.2
    )

    return timeline
  }

  private animateDiagram = () => {
    // Determine if we're showing the desktop or mobile variation of the animation
    const isMobile = window.innerWidth < 768

    if (!this.timeline) return

    // Clear existing animations
    this.timeline.clear()

    // Animate the input nodes/lines
    const inputLineIndexes = this.prepareInputs()
    inputLineIndexes.forEach((lineIndex, fileIndex) => {
      const inputLine = this.state.inputLines[lineIndex as number]
      const inputTimeline = isMobile
        ? this.animateSingleInputMobile(inputLine)
        : this.animateSingleInputDesktop(inputLine)

      this.timeline?.add(inputTimeline, fileIndex * (isMobile ? 0.4 : 0.2))
    })

    // Illuminate the logo and colored indicators
    this.timeline.add(() => this.setState({ blueIndicator: true }), isMobile ? '>-2' : '>-0.2')
    this.timeline.add(() => this.setState({ illuminateLogo: true }), '<-0.3')
    this.timeline.add(() => this.setState({ pinkIndicator: true }), '<+0.3')

    // Animate the output nodes/lines
    this.timeline.addLabel('showOutput', '<')
    this.state.outputLines.forEach((outputLine, index) => {
      const outputTimeline = isMobile
        ? this.animateSingleOutputMobile(outputLine)
        : this.animateSingleOutputDesktop(outputLine, index)

      this.timeline?.add(outputTimeline, 'showOutput+=' + (isMobile ? 0.3 : 0.1) * index)
    })

    // Desktop only reset
    if (!isMobile) {
      // Disable the colored indicators
      this.timeline.add(() => this.setState({ blueIndicator: false }), '>-1')
      this.timeline.add(() => this.setState({ pinkIndicator: false }), '<')
    }

    // Play the timeline
    this.timeline.play()
  }

  render() {
    const { blueIndicator, pinkIndicator, illuminateLogo, isUwu, isChromiumBrowser, inputLines, outputLines } = this.state

    return (
      <>
        <div className="hero__diagram" id="hero-diagram">
          {/* Input Lines */}
          <SvgInputs inputLines={inputLines} />

          {/* Output Line */}
          <SvgOutputs outputLines={outputLines.map(line => ({ current: line }))} />

          {/* Blue Indicator */}
          <SvgBlueIndicator active={blueIndicator} />

          {/* Pink Indicator */}
          <SvgPinkIndicator active={pinkIndicator} />

          {/* Vite Chip */}
          <div className={`vite-chip ${illuminateLogo ? 'active' : ''}`}>
            <div className="vite-chip__background">
              <div className="vite-chip__border" />
              <div
                className={`vite-chip__edge ${isChromiumBrowser ? 'edge--animated' : ''
                  }`}
              />
            </div>
            <div className="vite-chip__filter" />
            <img
              src={isUwu ? '/logo-uwu.png' : '/logo.svg'}
              alt={isUwu ? 'Vite Kawaii Logo by @icarusgkx' : 'Vite Logo'}
              className={`vite-chip__logo ${isUwu ? 'uwu' : ''}`}
            />
          </div>
        </div>

        {/* Background */}
        <div className={`hero__background ${illuminateLogo ? 'active' : ''}`} />
      </>
    )
  }
}
