import { useEffect, useState } from "react";

export function Pacman() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<'right' | 'left' | 'down' | 'up'>('right');
  const [isVisible, setIsVisible] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Check if last section (SlideFooter) is visible
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkVisibility = () => {
      // Check if scrolled to bottom (within 50px threshold)
      const scrolledToBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50);

      if (scrolledToBottom && !isActive) {
        setIsActive(true);
      } else if (!scrolledToBottom && isActive) {
        setIsActive(false);
        setIsInitialized(false); // Reset so it reinitializes when visible again
      }
    };

    // Check on scroll
    window.addEventListener('scroll', checkVisibility);
    // Check on mount
    checkVisibility();

    return () => {
      window.removeEventListener('scroll', checkVisibility);
    };
  }, [isActive]);

  // Initialize on client-side when activated
  useEffect(() => {
    if (typeof window === 'undefined' || !isActive) return;
    
    // Start below the navbar (which is probably at the top)
    const startY = 150; // Below typical navbar height
    setPosition({ x: 0, y: startY });
    setIsInitialized(true);
  }, [isActive]);

  // Check if a specific move would cause a collision
  const wouldCollideInDirection = (x: number, y: number, dir: 'right' | 'left' | 'down' | 'up') => {
    if (typeof window === 'undefined') return false;
    
    const pacmanSize = 25; // Smaller size
    const moveSpeed = 3;
    let testX = x;
    let testY = y;
    
    // Calculate test position based on direction
    switch (dir) {
      case 'right': testX = x + moveSpeed; break;
      case 'left': testX = x - moveSpeed; break;
      case 'down': testY = y + moveSpeed; break;
      case 'up': testY = y - moveSpeed; break;
    }
    
    // Check screen boundaries
    if (testX < 0 || testX + pacmanSize > window.innerWidth ||
        testY < 0 || testY + pacmanSize > window.innerHeight) {
      return true;
    }
    
    // Check section collisions
    const sections = document.querySelectorAll('section, nav');
    for (const section of Array.from(sections)) {
      const rect = section.getBoundingClientRect();
      
      if (testX + pacmanSize > rect.left &&
          testX < rect.right &&
          testY + pacmanSize > rect.top &&
          testY < rect.bottom) {
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized || !isActive) return;
    
    const moveSpeed = 2;
    const changeDirectionChance = 0.01; // 1% chance per frame to change direction

    const animate = () => {
      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        let newDirection = direction;

        // Move based on direction
        switch (direction) {
          case 'right':
            newX = prev.x + moveSpeed;
            break;
          case 'left':
            newX = prev.x - moveSpeed;
            break;
          case 'down':
            newY = prev.y + moveSpeed;
            break;
          case 'up':
            newY = prev.y - moveSpeed;
            break;
        }

        // Check if current move would collide
        if (wouldCollideInDirection(prev.x, prev.y, direction)) {
          // Test all directions to find available ones
          const availableDirections: Array<'right' | 'left' | 'down' | 'up'> = [];
          const allDirections: Array<'right' | 'left' | 'down' | 'up'> = ['right', 'left', 'down', 'up'];
          
          for (const dir of allDirections) {
            if (!wouldCollideInDirection(prev.x, prev.y, dir)) {
              // Don't go backwards unless necessary
              const isBackwards = (dir === 'right' && direction === 'left') ||
                                (dir === 'left' && direction === 'right') ||
                                (dir === 'up' && direction === 'down') ||
                                (dir === 'down' && direction === 'up');
              
              if (!isBackwards) {
                availableDirections.push(dir);
              }
            }
          }
          
          // If no directions available (excluding backwards), try including backwards
          if (availableDirections.length === 0) {
            for (const dir of allDirections) {
              if (!wouldCollideInDirection(prev.x, prev.y, dir)) {
                availableDirections.push(dir);
              }
            }
          }
          
          if (availableDirections.length > 0) {
            newDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            setDirection(newDirection);
          } else {
          }
          
          return prev; // Don't move
        }
        
        setIsVisible(true);

        // Random direction change (when not colliding)
        if (Math.random() < changeDirectionChance) {
          const directions: Array<'right' | 'left' | 'down' | 'up'> = ['right', 'left', 'down', 'up'];
          // Don't go backwards
          const oppositeDirection = direction === 'right' ? 'left' : direction === 'left' ? 'right' : direction === 'up' ? 'down' : 'up';
          const validDirections = directions.filter(d => d !== oppositeDirection);
          newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
          setDirection(newDirection);
        }

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [direction, isInitialized]);

  // Calculate rotation based on direction
  const getRotation = () => {
    switch (direction) {
      case 'right': return 0;
      case 'down': return 90;
      case 'left': return 180;
      case 'up': return 270;
      default: return 0;
    }
  };

  // Don't render on server
  if (typeof window === 'undefined') {
    return null;
  }

  // Calculate opacity based on active state
  const opacity = isActive && isInitialized && isVisible ? 1 : 0;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `rotate(${getRotation()}deg)`,
        transition: 'transform 0.3s ease, opacity 0.5s ease',
        zIndex: -1,
        opacity: opacity,
      }}
    >
      {/* Pacman SVG - Smaller */}
      <svg width="25" height="25" viewBox="0 0 50 50" className="pacman-chomp">
        <defs>
          <style>{`
            .pacman-chomp {
              animation: chomp 0.3s ease-in-out infinite alternate;
            }
          `}</style>
        </defs>
        {/* Pacman body - pie shape with animated mouth */}
        <g className="pacman-mouth">
          <circle cx="25" cy="25" r="22" fill="var(--color-gray-300" />
          {/* Mouth - triangle cutout */}
          <path 
            d="M 25 25 L 47 15 A 22 22 0 0 1 47 35 Z" 
            fill="rgb(242, 245, 250)"
            className="mouth-animation"
          />
        </g>
        {/* Eye */}
        <circle cx="32" cy="18" r="3" fill="#000" />
      </svg>
      
      {/* Trail effect - dots being "eaten" */}
      {/* <div 
        className="absolute"
        style={{
          left: direction === 'right' ? '-40px' : direction === 'left' ? '25px' : '8px',
          top: direction === 'down' ? '-40px' : direction === 'up' ? '25px' : '8px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-gray-500"
            style={{
              left: direction === 'right' || direction === 'left' ? `${i * 12}px` : '0',
              top: direction === 'down' || direction === 'up' ? `${i * 12}px` : '0',
              opacity: 1 - i * 0.3,
              animation: `fadeOut 0.6s ease-out ${i * 0.15}s forwards`,
            }}
          />
        ))}
      </div> */}
    </div>
  );
}

