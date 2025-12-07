// Main initialization function
export function initDiagramExtra() {
  // Pan & Zoom functionality for an SVG element
  function initPanZoomForElement(
    svg: SVGSVGElement,
    initialViewBoxState: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    resetViewBox: boolean = false
  ) {
    // Use the passed-in initial viewBox state as the max zoom out limit
    // This was captured on initial render before any modifications
    const originalViewBox = {
      x: initialViewBoxState.x,
      y: initialViewBoxState.y,
      width: initialViewBoxState.width,
      height: initialViewBoxState.height,
    };

    // Now setup SVG styles
    svg.style.touchAction = "none";
    svg.style.userSelect = "none";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Ensure viewBox exists - set it if it doesn't or if resetViewBox is true
    if (
      resetViewBox ||
      !svg.viewBox ||
      !svg.viewBox.baseVal.width ||
      !svg.viewBox.baseVal.height
    ) {
      svg.setAttribute(
        "viewBox",
        `${originalViewBox.x} ${originalViewBox.y} ${originalViewBox.width} ${originalViewBox.height}`
      );
    }

    // Pan state
    let isPanning = false;
    let didPan = false;
    let startPoint = { x: 0, y: 0, w: 0, h: 0 };
    let startViewBox = { x: 0, y: 0, w: 0, h: 0 };

    // Pan handlers
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      startPoint = {
        x: e.clientX,
        y: e.clientY,
        w: rect.width,
        h: rect.height,
      };
      startViewBox = {
        x: svg.viewBox.baseVal.x,
        y: svg.viewBox.baseVal.y,
        w: svg.viewBox.baseVal.width,
        h: svg.viewBox.baseVal.height,
      };

      isPanning = true;
      didPan = false;
      svg.classList.add("is-grabbing");
      svg.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanning) return;
      e.preventDefault();

      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;

      // Check if we've moved enough to consider it a pan
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        didPan = true;
      }

      // Calculate scale factors
      const scaleX = startViewBox.w / startPoint.w;
      const scaleY = startViewBox.h / startPoint.h;

      // Calculate new viewBox position
      const newX = startViewBox.x - dx * scaleX;
      const newY = startViewBox.y - dy * scaleY;

      svg.setAttribute(
        "viewBox",
        `${newX} ${newY} ${startViewBox.w} ${startViewBox.h}`
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPanning) return;
      isPanning = false;
      svg.classList.remove("is-grabbing");
      svg.releasePointerCapture?.(e.pointerId);
    };

    const handleClick = (e: MouseEvent) => {
      // Prevent click events when we've been panning
      if (didPan) {
        e.stopPropagation();
        e.preventDefault();
        didPan = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Validate originalViewBox
      if (
        !originalViewBox ||
        originalViewBox.width <= 0 ||
        originalViewBox.height <= 0
      ) {
        console.error("Invalid originalViewBox:", originalViewBox);
        return;
      }

      const viewBox = svg.viewBox.baseVal;
      const rect = svg.getBoundingClientRect();

      // Validate current viewBox
      if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
        console.error("Invalid current viewBox");
        return;
      }

      // Mouse position relative to SVG
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom factor: deltaY > 0 means scroll down (zoom OUT), deltaY < 0 means scroll up (zoom IN)
      // zoomFactor > 1 = viewBox gets BIGGER = zoom OUT
      // zoomFactor < 1 = viewBox gets SMALLER = zoom IN
      const zoomFactor = Math.pow(1.06, e.deltaY > 0 ? 1 : -1);

      // Current viewBox values
      const currentX = viewBox.x;
      const currentY = viewBox.y;
      const currentWidth = viewBox.width;
      const currentHeight = viewBox.height;

      // Mouse position in viewBox coordinates
      const mouseViewBoxX = currentX + (mouseX / rect.width) * currentWidth;
      const mouseViewBoxY = currentY + (mouseY / rect.height) * currentHeight;

      // New dimensions
      let newWidth = currentWidth * zoomFactor;
      let newHeight = currentHeight * zoomFactor;

      // Clamp zoom levels - max zoom out should match original viewBox dimensions
      const maxWidth = originalViewBox.width;
      const maxHeight = originalViewBox.height;
      const minWidth = 10;
      const minHeight = 10;

      // Use a small epsilon to handle floating point precision
      const epsilon = 0.1;

      // Check if we're trying to zoom OUT (making viewBox bigger)
      const isZoomingOut = zoomFactor > 1;
      const isZoomingIn = zoomFactor < 1;

      // Handle zoom out limits (prevent zooming out beyond initial state)
      if (isZoomingOut) {
        // Check if we're already at or beyond the max zoom out limit
        const isAtOrBeyondMax =
          (currentWidth >= maxWidth - epsilon &&
            currentHeight >= maxHeight - epsilon) ||
          currentWidth > maxWidth + epsilon ||
          currentHeight > maxHeight + epsilon;

        // If we're at max and trying to zoom out further, prevent it
        if (isAtOrBeyondMax) {
          // Snap to exactly the original viewBox if we're beyond it
          if (
            currentWidth > maxWidth + epsilon ||
            currentHeight > maxHeight + epsilon
          ) {
            svg.setAttribute(
              "viewBox",
              `${originalViewBox.x} ${originalViewBox.y} ${maxWidth} ${maxHeight}`
            );
          }
          return;
        }

        // Check if the new dimensions would exceed the max
        const wouldExceedMax =
          newWidth > maxWidth + epsilon || newHeight > maxHeight + epsilon;

        // Clamp to max (zoom out limit) - if we exceed, set to exactly original dimensions
        if (wouldExceedMax) {
          newWidth = maxWidth;
          newHeight = maxHeight;
          // Set position to original position when at max zoom out
          const newX = originalViewBox.x;
          const newY = originalViewBox.y;
          svg.setAttribute(
            "viewBox",
            `${newX} ${newY} ${newWidth} ${newHeight}`
          );
          return;
        }
      }

      // Handle zoom in limits (prevent zooming in too much)
      if (isZoomingIn) {
        // Clamp to min (zoom in limit)
        if (newWidth < minWidth || newHeight < minHeight) {
          // Scale up to fit within min dimensions while maintaining aspect ratio
          const widthScale = minWidth / newWidth;
          const heightScale = minHeight / newHeight;
          const scale = Math.max(widthScale, heightScale);
          newWidth = newWidth * scale;
          newHeight = newHeight * scale;
        }
      }

      // Calculate new position to keep mouse position fixed
      const newX = mouseViewBoxX - (mouseX / rect.width) * newWidth;
      const newY = mouseViewBoxY - (mouseY / rect.height) * newHeight;

      svg.setAttribute("viewBox", `${newX} ${newY} ${newWidth} ${newHeight}`);
    };

    // Add event listeners
    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", handlePointerUp);
    svg.addEventListener("pointercancel", handlePointerUp);
    svg.addEventListener("wheel", handleWheel, { passive: false });
    svg.addEventListener("click", handleClick);

    // Cleanup function (you can call this if needed)
    return () => {
      svg.removeEventListener("pointerdown", handlePointerDown);
      svg.removeEventListener("pointermove", handlePointerMove);
      svg.removeEventListener("pointerup", handlePointerUp);
      svg.removeEventListener("pointercancel", handlePointerUp);
      svg.removeEventListener("wheel", handleWheel);
      svg.removeEventListener("click", handleClick);
    };
  }

  function init() {
    const allSvgs = document.querySelectorAll(
      ".extra-diagram > svg"
    ) as NodeListOf<SVGSVGElement>;

    allSvgs.forEach((svg) => {
      // CRITICAL: Capture the initial viewBox state FIRST, before ANY modifications
      // This is the state on initial render - this will be the max zoom out limit
      let initialViewBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };

      if (
        svg.viewBox &&
        svg.viewBox.baseVal.width &&
        svg.viewBox.baseVal.height
      ) {
        initialViewBox = {
          x: svg.viewBox.baseVal.x,
          y: svg.viewBox.baseVal.y,
          width: svg.viewBox.baseVal.width,
          height: svg.viewBox.baseVal.height,
        };
      } else {
        // If no viewBox exists, get dimensions from attributes or computed size
        let originalWidth = Number(svg.getAttribute("width")) || 0;
        let originalHeight = Number(svg.getAttribute("height")) || 0;

        if (!originalWidth || !originalHeight) {
          const rect = svg.getBoundingClientRect();
          originalWidth = originalWidth || rect.width || 800;
          originalHeight = originalHeight || rect.height || 600;
        }

        initialViewBox = {
          x: 0,
          y: 0,
          width: originalWidth,
          height: originalHeight,
        };
      }

      // Wrap SVG in a container with group class for hover effect
      const parent = svg.parentElement;
      if (!parent) return;

      const wrapper = parent;

      // Create fullscreen button
      const fullscreenButton = document.createElement("div");
      fullscreenButton.className = "extra-diagram-fullscreen-button";
      fullscreenButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
          <path d="M216,48V96a8,8,0,0,1-16,0V67.31l-42.34,42.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM98.34,146.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l42.35-42.34a8,8,0,0,0-11.32-11.32ZM208,152a8,8,0,0,0-8,8v28.69l-42.34-42.35a8,8,0,0,0-11.32,11.32L188.69,200H160a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V160A8,8,0,0,0,208,152ZM67.31,56H96a8,8,0,0,0,0-16H48a8,8,0,0,0-8,8V96a8,8,0,0,0,16,0V67.31l42.34,42.35a8,8,0,0,0,11.32-11.32Z"></path>
        </svg>
      `;
      wrapper.appendChild(fullscreenButton);

      // Show button on hover
      wrapper.addEventListener("mouseenter", () => {
        fullscreenButton.style.opacity = "1";
      });
      wrapper.addEventListener("mouseleave", () => {
        fullscreenButton.style.opacity = "0";
      });

      // Modal functionality
      fullscreenButton.addEventListener("click", () => {
        // Create modal overlay
        const modal = document.createElement("div");
        modal.className = "extra-diagram-modal-overlay";

        // Create modal content container
        const modalContent = document.createElement("div");
        modalContent.className = "extra-diagram-modal";

        // Create close button
        const closeButton = document.createElement("button");
        closeButton.className = "extra-diagram-modal-close";
        closeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
          </svg>
        `;

        // Clone the SVG
        const svgClone = svg.cloneNode(true) as SVGSVGElement;

        // Close modal function
        const closeModal = () => {
          document.body.removeChild(modal);
          document.body.style.overflow = "";
        };

        // Close on click outside or close button
        closeButton.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });

        // Close on Escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            closeModal();
            document.removeEventListener("keydown", handleEscape);
          }
        };
        document.addEventListener("keydown", handleEscape);

        // Assemble modal
        modalContent.appendChild(svgClone);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Prevent body scroll
        document.body.style.overflow = "hidden";

        // Use the original initial viewBox as the max zoom-out limit
        const cloneInitialViewBox = { ...initialViewBox };

        // Start the clone at the current zoomed viewBox so it visually matches the source,
        // but allow zooming back out to the original limits captured above.
        if (
          svg.viewBox &&
          svg.viewBox.baseVal.width &&
          svg.viewBox.baseVal.height
        ) {
          svgClone.setAttribute(
            "viewBox",
            `${svg.viewBox.baseVal.x} ${svg.viewBox.baseVal.y} ${svg.viewBox.baseVal.width} ${svg.viewBox.baseVal.height}`
          );
        }

        // Initialize pan & zoom for the cloned SVG without forcing a reset
        initPanZoomForElement(svgClone, cloneInitialViewBox, false);
      });

      // Initialize pan & zoom for the original SVG using the captured initial viewBox
      initPanZoomForElement(svg, initialViewBox, false);
    });
  }

  // // Initialize on load
  window.addEventListener("xyd::pathnameChange", () => {
    setTimeout(() => {
      init();
    }, 300);
  });
}
