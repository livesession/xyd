import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

// Register the plugin
gsap.registerPlugin(MotionPathPlugin)

interface SvgBackgroundLinesProps {
  paths: string[]
}

export function SvgBackgroundLines({ paths }: SvgBackgroundLinesProps) {
  const dotsRef = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const animations = paths.map((path, index) => {
      const dot = dotsRef.current[index]
      if (!dot) return null

      // Create a separate timeline for each dot
      const tl = gsap.timeline({ 
        repeat: -1,
        repeatDelay: Math.random() * 2
      })

      // Initial state
      tl.set(dot, { 
        opacity: 0,
        autoAlpha: 0
      })

      // Animate the dot
      tl.to(dot, {
        motionPath: {
          path: path,
          align: path,
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
          start: 0,
          end: 1
        },
        autoAlpha: 0.5,
        duration: 5 + Math.random() * 3,
        ease: "none",
        delay: Math.random() * 2
      })

      // Fade out at the end
      tl.to(dot, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "none"
      }, "-=0.5")

      return tl
    })

    return () => {
      animations.forEach(tl => tl?.kill())
    }
  }, [paths])

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none',
      zIndex: 0
    }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="844"
        height="644"
        viewBox="0 0 844 644"
        fill="none"
        style={{ width: '100%', height: '100%' }}
      >
        {paths.map((_, index) => (
          <circle
            key={index}
            ref={(el) => {
              dotsRef.current[index] = el
            }}
            r="1.5"
            fill="#fff"
            style={{
              filter: 'blur(0.5px) brightness(1.5)',
              opacity: 0,
              visibility: 'hidden'
            }}
          />
        ))}
      </svg>
    </div>
  )
} 