'use client'

import React, {useState, useEffect, useRef} from 'react'
import {gsap} from 'gsap'
import {MotionPathPlugin} from 'gsap/dist/MotionPathPlugin'
import {ScrollTrigger} from 'gsap/dist/ScrollTrigger'
import {SvgInputs} from './SvgInputs'
import {SvgOutputs} from './SvgOutputs'
import {SvgBlueIndicator} from './SvgBlueIndicator'
import {SvgPinkIndicator} from './SvgPinkIndicator'
import {SvgNodeProps} from './SvgNode'
import {SvgTechstackIndicator} from './SvgTechstackIndicator'

import styles from "./HeroDiagram.module.css"


// TODO: in the future animated light on input lines?

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
        {label: 'GraphQL', color: '#E10098'},
        {label: 'OpenAPI', color: '#93d500'},
        {label: 'TypeDoc', color: '#9601fe'},
    ],
    [
        {label: 'Go', color: '#00ACD7'},
        {label: 'Node', color: '#83cd29'},
        {label: 'Python', color: '#3571a3'},
    ],
    [
        {label: 'Storybook', color: '#FF4785'},
        {label: 'NPM', color: '#CB3837'},
        {label: 'GitHub', color: '#24292f'},
    ],
    [
        {label: 'llms.txt', color: '#FFBE0E'},
        {label: 'MCP', color: '#000'},
        {label: 'Agents SDK', color: '#74aa9c'},
    ]
]

const HeroDiagram: React.FC = () => {
    const scrollTriggerInstance = useRef<ScrollTrigger | null>(null)
    const inputSetInterval = useRef<NodeJS.Timeout | null>(null)
    const lastInputSetIndex = useRef<number>(-1)
    const timeline = useRef<gsap.core.Timeline | null>(null)
    const isAnimating = useRef<boolean>(false)
    const previousInputLineIndexes = useRef<number[]>([])

    const [state, setState] = useState({
        blueIndicator: false,
        pinkIndicator: false,
        techstackIndicator: false,
        illuminateLogo: false,
        isChromiumBrowser: 'chrome' in window,
        inputLines: inputPaths.map((path) => ({
            position: 0,
            visible: false,
            labelVisible: false,
            label: '',
            dotColor: '',
            glowColor: '',
            path,
        })),
        outputLines: [
            {
                position: 0,
                visible: false,
                labelVisible: false,
                label: 'sdks',
                path: 'M843.463 1.3315L245.316 5.47507L0.633077 4.69725',
                dotColor: '#da3633',
                glowColor: '#da3633'
            },
            {
                position: 0,
                visible: false,
                labelVisible: false,
                label: 'docs',
                path: 'M843.463 1.3315L245.316 5.47507L0.633077 4.69725',
                dotColor: '#8957e5',
                glowColor: '#8957e5'
            },
        ],
    })

    const prepareInputs = () => {
        let newIndex // TODO: round-robin
        do {
            newIndex = Math.floor(Math.random() * inputFileSets.length)
        } while (newIndex === lastInputSetIndex.current)
        lastInputSetIndex.current = newIndex

        const inputFileSet = inputFileSets[newIndex]
        const maxFiles = inputFileSet.length
        const availablePaths = inputPaths.length
        const numLinesToShow = Math.min(maxFiles, 3) // Show up to 3 lines, but no more than available files

        // Generate random unique indexes
        let inputLineIndexes = Array.from({length: availablePaths}, (_, i) => i)
            .sort(() => Math.random() - 0.5)
            .slice(0, numLinesToShow)
            .sort((a, b) => a - b) // Sort to maintain visual order

        let newInputLines = [...state.inputLines]

        // Reset all lines to initial state
        newInputLines.forEach(line => {
            line.visible = false
            line.labelVisible = false
            line.position = 0
        })

        // Then set up new lines
        inputLineIndexes.forEach((lineIndex, fileIndex) => {
            if (fileIndex >= inputFileSet.length) {
                return
            }

            const line = newInputLines[lineIndex]
            line.label = inputFileSet[fileIndex].label
            line.dotColor = inputFileSet[fileIndex].color
            line.glowColor = inputFileSet[fileIndex].color
            line.path = inputPaths[lineIndex]
        })

        // Update previous indexes for next run
        previousInputLineIndexes.current = inputLineIndexes

        setState(prev => ({...prev, inputLines: newInputLines}))
        return inputLineIndexes
    }

    const animateSingleInputDesktop = (inputLine: SvgNodeProps) => {
        const timeline = gsap.timeline()

        // Ensure line starts hidden
        timeline.set(
            inputLine,
            {
                position: 0,
                visible: false,
                labelVisible: false,
            },
            0
        )

        // Animate the line
        timeline.to(
            inputLine,
            {
                position: Math.random() * 0.1 + 0.4,
                duration: 1,
                ease: 'expo.out',
                onUpdate: () => {
                    //TODO: some perf issues?
                    setState(prev => ({...prev}))
                }
            },
            0
        )

        // Show the line
        timeline.set(
            inputLine,
            {
                visible: true,
            },
            0
        )

        timeline.set(
            inputLine,
            {
                labelVisible: true,
            },
            0.2
        )

        timeline.to(
            inputLine,
            {
                position: 1,
                duration: 1.2,
                ease: 'power3.in',
                onUpdate: () => {
                    setState(prev => ({...prev}))
                }
            },
            1.2
        )

        // Hide the line at the end
        timeline.set(
            inputLine,
            {
                labelVisible: false,
            },
            1.6
        )

        timeline.set(
            inputLine,
            {
                visible: false,
            },
            1.9
        )

        return timeline
    }

    const animateSingleOutputDesktop = (
        outputLine: SvgNodeProps,
        index: number
    ) => {
        const timeline = gsap.timeline()

        timeline.set(
            outputLine,
            {
                position: 0,
                visible: false,
                labelVisible: false,
            },
            0
        )

        timeline.to(
            outputLine,
            {
                position: (0.7 / 3) * (index + 1) + 0.05,
                duration: 1.5,
                ease: 'expo.out',
                onUpdate: () => {
                    setState(prev => ({...prev}))
                }
            },
            0
        )

        timeline.set(
            outputLine,
            {
                visible: true,
            },
            0
        )

        timeline.set(
            outputLine,
            {
                labelVisible: true,
            },
            0.4
        )

        timeline.to(
            outputLine,
            {
                position: 1,
                duration: 1.5,
                ease: 'power3.in',
                onUpdate: () => {
                    setState(prev => ({...prev}))
                }
            },
            2
        )

        timeline.set(
            outputLine,
            {
                labelVisible: false,
            },
            2.5
        )

        timeline.set(
            outputLine,
            {
                visible: false,
            },
            3
        )

        return timeline
    }

    const animateSingleInputMobile = (inputLine: SvgNodeProps) => {
        const timeline = gsap.timeline()

        timeline.set(
            inputLine,
            {
                position: 0,
                visible: false,
                labelVisible: false,
            },
            0
        )

        timeline.to(
            inputLine,
            {
                position: 1,
                duration: 1.8,
                ease: 'power2.out',
                onUpdate: () => {
                    setState(prev => ({...prev}))
                }
            },
            0
        )

        timeline.set(
            inputLine,
            {
                visible: true,
            },
            0
        )

        timeline.set(
            inputLine,
            {
                visible: false,
            },
            0.5
        )

        return timeline
    }

    const animateSingleOutputMobile = (outputLine: SvgNodeProps) => {
        const timeline = gsap.timeline()

        timeline.set(
            outputLine,
            {
                position: 0,
                visible: false,
                labelVisible: false,
            },
            0
        )

        timeline.to(
            outputLine,
            {
                position: 0.7,
                duration: 2,
                ease: 'power1.inOut',
                onUpdate: () => {
                    setState(prev => ({...prev}))
                }
            },
            0.3
        )

        timeline.set(
            outputLine,
            {
                visible: true,
            },
            0.75
        )

        timeline.set(
            outputLine,
            {
                visible: false,
            },
            1.2
        )

        return timeline
    }

    const animateDiagram = () => {
        if (!timeline.current || isAnimating.current) return
        isAnimating.current = true

        const isMobile = window.innerWidth < 768

        // Kill any existing animations first
        if (timeline.current) {
            timeline.current.kill()
        }
        timeline.current = gsap.timeline({
            repeat: -1,
            onRepeat: () => {
                isAnimating.current = false
                animateDiagram()
            }
        })

        const inputLineIndexes = prepareInputs()

        // First, ensure all lines are hidden
        state.inputLines.forEach(line => {
            line.visible = false
            line.labelVisible = false
            line.position = 0
        })

        inputLineIndexes.forEach((lineIndex, fileIndex) => {
            const inputLine = state.inputLines[lineIndex as number]
            const inputTimeline = isMobile
                ? animateSingleInputMobile(inputLine)
                : animateSingleInputDesktop(inputLine)

            timeline.current?.add(inputTimeline, fileIndex * (isMobile ? 0.4 : 0.2))
        })

        timeline.current?.add(() => setState(prev => ({...prev, blueIndicator: true})), isMobile ? '>-2' : '>-0.2')
        timeline.current?.add(() => setState(prev => ({...prev, illuminateLogo: true})), '<-0.3')
        timeline.current?.add(() => setState(prev => ({...prev, pinkIndicator: true})), '<+0.3')
        timeline.current?.add(() => setState(prev => ({...prev, techstackIndicator: true})), '<+0.3')

        timeline.current?.addLabel('showOutput', '<')
        state.outputLines.forEach((outputLine, index) => {
            const outputTimeline = isMobile
                ? animateSingleOutputMobile(outputLine)
                : animateSingleOutputDesktop(outputLine, index)

            timeline.current?.add(outputTimeline, 'showOutput+=' + (isMobile ? 0.3 : 0.1) * index)
        })

        if (!isMobile) {
            timeline.current?.add(() => setState(prev => ({...prev, blueIndicator: false})), '>-1')
            timeline.current?.add(() => setState(prev => ({...prev, pinkIndicator: false})), '<')
            timeline.current?.add(() => setState(prev => ({...prev, techstackIndicator: false})), '<')
        }

        timeline.current?.play()
    }

    useEffect(() => {
        timeline.current = gsap.timeline({
            repeat: -1,
            onRepeat: () => {
                isAnimating.current = false
                animateDiagram()
            }
        })

        animateDiagram()

        inputSetInterval.current = setInterval(() => {
            if (!isAnimating.current) {
                animateDiagram()
            }
        }, 5000)

        scrollTriggerInstance.current = ScrollTrigger.create({
            trigger: '#hero-diagram',
            start: 'center 100%',
            once: true,
            onEnter: () => {
                if (timeline.current) {
                    timeline.current.play()
                }
            },
        })

        return () => {
            if (inputSetInterval.current) {
                clearInterval(inputSetInterval.current)
            }
            if (timeline.current) {
                timeline.current.kill()
            }
            if (scrollTriggerInstance.current) {
                scrollTriggerInstance.current.kill()
            }
        }
    }, [])

    const {
        blueIndicator,
        pinkIndicator,
        illuminateLogo,
        isChromiumBrowser,
        inputLines,
        outputLines
    } = state

    return (
        <>
            <div className={styles.HeroDiagram} id="hero-diagram">
                {/* Input Lines */}
                <SvgInputs inputLines={inputLines}/>

                {/* Output Line */}
                <SvgOutputs outputLines={outputLines.map(line => ({current: line}))}/>

                {/* Blue Indicator */}
                <SvgBlueIndicator active={blueIndicator}/>

                {/* Pink Indicator */}
                <SvgPinkIndicator active={pinkIndicator}/>

                {/* Techstack Indicator */}
                <SvgTechstackIndicator active={pinkIndicator}/>

                <div className={`${styles.ViteChip} ${illuminateLogo ? styles.ViteChip__active : ''}`}>
                    <div>
                        <div className={styles.ViteChip_Border}/>
                        <div
                            className={`${styles.ViteChip_Edge} ${isChromiumBrowser ? styles.ViteChip_Edge__animated : ''}`}
                        />
                    </div>
                    <div className={styles.ViteChip_Filter}/>
                    <img
                        src="/logo.svg"
                        alt="xyd Logo"
                        className={styles.ViteChip_Logo}
                    />
                </div>
            </div>

            {/* Background */}
            <div className={`${styles.HeroBackground} ${illuminateLogo ? styles.HeroBackground__active : ''}`}/>
        </>
    )
}

export default HeroDiagram
