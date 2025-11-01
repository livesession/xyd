import { useRef } from "react";

export function SlideFooter() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="slide-footer-root">
      <div className="slide-footer-noise" />
      <div className="slide-footer-background" />
      <div className="slide-footer-inner">
        <span className="text-gray-900">just docs it.</span>
      </div>
    </section>
  );
}
