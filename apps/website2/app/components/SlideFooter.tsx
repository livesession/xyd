import { useEffect, useRef, useState } from "react";

export function SlideFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [bottomOffset, setBottomOffset] = useState(30);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const windowHeight = window.innerHeight;

      // Calculate progress based on when section enters viewport until page end
      // Start: when section top is at bottom of viewport (rect.top = windowHeight)
      // End: when we've scrolled to the very bottom of the page
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = documentHeight - windowHeight;

      // Get the scroll position when section enters viewport
      const sectionOffsetTop = sectionRef.current.offsetTop;
      const scrollStart = Math.max(0, sectionOffsetTop - windowHeight);

      // Calculate progress from when section enters to end of page
      const scrollDistance = maxScroll - scrollStart;
      const currentScroll = scrollTop - scrollStart;

      const progress = Math.max(0, Math.min(1, currentScroll / scrollDistance));

      // Interpolate from 30px to different max based on screen size
      // Mobile: 135px, Desktop: 105px
      const isMobile = window.innerWidth < 768;
      const maxBottom = isMobile ? 135 : 105;
      const bottomRange = maxBottom - 30;
      const newBottom = 30 + bottomRange * progress;
      setBottomOffset(newBottom);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="slide-footer-root">
      <div className="slide-footer-background" />
      <div
        className="slide-footer-inner"
        style={{ bottom: `${bottomOffset}px` }}
      >
        <span className="text-gray-900">just docs it.</span>
      </div>
    </section>
  );
}
