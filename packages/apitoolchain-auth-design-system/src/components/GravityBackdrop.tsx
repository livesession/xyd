import { useEffect, useRef, useState } from "react";

/** Dims the backdrop behind the card without ever fully clearing it, so the
 * dots stay faintly present under the form and strongest toward the edges. A
 * raised centre floor (~0.5 alpha) + shorter fade keeps it from feeling empty. */
const MASK =
  "radial-gradient(ellipse 62% 52% at 50% 45%, rgba(0,0,0,0.5) 12%, black 60%)";
/** The plain CSS dot pattern — SSR/no-JS fallback, and what the canvas paints at rest. */
const DOT_BG =
  "radial-gradient(color-mix(in oklab, var(--color-subtle) 32%, transparent) 1px, transparent 1.2px)";

const GAP = 18; // dot spacing
const DOT = 1.5; // dot size (px)
const RADIUS = 150; // gravity influence radius (px)
const PULL = 0.42; // max fraction pulled toward the pointer
const EASE = 0.16; // spring toward the target each frame
const BASE_A = 0.32; // resting dot opacity
const GLOW_A = 0.5; // extra dot opacity as it collapses inward
const EDGE = 5; // points sampled per rectangle edge (so lines can bend)

type Pt = { bx: number; by: number; x: number; y: number };
type Shape = { pts: Pt[]; alpha: number };

/** Sample a rectangle outline into points (so gravity can bend its edges). */
function rectPts(x: number, y: number, s: number): Pt[] {
  const corners = [
    [x, y],
    [x + s, y],
    [x + s, y + s],
    [x, y + s],
  ];
  const pts: Pt[] = [];
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e];
    const [bx, by] = corners[(e + 1) % 4];
    for (let k = 0; k < EDGE; k++) {
      const t = k / EDGE;
      const gx = ax + (bx - ax) * t;
      const gy = ay + (by - ay) * t;
      pts.push({ bx: gx, by: gy, x: gx, y: gy });
    }
  }
  return pts;
}

/** A diagonal run of corner-touching squares — the apitoolchain logo motif,
 * stepping up to the NE like a pixel line. */
function staircase(
  out: Shape[],
  sx: number,
  sy: number,
  size: number,
  count: number,
  alpha: number,
) {
  for (let i = 0; i < count; i++)
    out.push({ pts: rectPts(sx + i * size, sy - (i + 1) * size, size), alpha });
}

/** Wire up the canvas; returns a cleanup fn. Canvas + ctx are passed in
 * non-null so the closures below don't fight TS's flow narrowing. */
function setup(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const cs = getComputedStyle(canvas);
  const dotColor = cs.getPropertyValue("--color-subtle").trim() || "#8f8f8f";
  const lineColor = cs.getPropertyValue("--color-body").trim() || "#282828";

  let dots: Pt[] = [];
  let shapes: Shape[] = [];
  let w = 0;
  let h = 0;
  let rect = canvas.getBoundingClientRect();
  const R2 = RADIUS * RADIUS;
  let px = -9999;
  let py = -9999;
  let active = false;

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GAP / 2; y < h; y += GAP)
      for (let x = GAP / 2; x < w; x += GAP) dots.push({ bx: x, by: y, x, y });
    const m = Math.min(w, h);
    const s = m * 0.075;
    shapes = [];
    // Left run tucked into the top-left window corner — wider now, so it reaches
    // a bit further in toward the centre. First square on the left edge, last on
    // the top, bleeding off the corner a touch.
    staircase(shapes, -s * 0.35, s * 5.5, s, 6, 0.5);
    staircase(shapes, w * 0.72, h * 0.99, m * 0.06, 7, 0.42);
    staircase(shapes, w * 0.84, h * 0.34, m * 0.036, 5, 0.36);
  }

  /** Pointer-gravity target for a base point. */
  function target(bx: number, by: number): [number, number, number] {
    if (!active) return [bx, by, 0];
    const dx = px - bx;
    const dy = py - by;
    const d2 = dx * dx + dy * dy;
    if (d2 >= R2) return [bx, by, 0];
    const dist = Math.sqrt(d2) || 0.0001;
    const f = 1 - dist / RADIUS;
    const pull = f * f * PULL;
    return [bx + dx * pull, by + dy * pull, f];
  }

  function paint(animate: boolean): boolean {
    ctx.clearRect(0, 0, w, h);
    let settled = !active;

    ctx.fillStyle = dotColor;
    for (const d of dots) {
      const [tx, ty, f] = animate ? target(d.bx, d.by) : [d.bx, d.by, 0];
      d.x += (tx - d.x) * EASE;
      d.y += (ty - d.y) * EASE;
      if (Math.abs(d.x - d.bx) > 0.25 || Math.abs(d.y - d.by) > 0.25)
        settled = false;
      ctx.globalAlpha = BASE_A + f * GLOW_A;
      ctx.fillRect(d.x - DOT / 2, d.y - DOT / 2, DOT, DOT);
    }

    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineColor;
    for (const sh of shapes) {
      ctx.beginPath();
      for (let k = 0; k < sh.pts.length; k++) {
        const p = sh.pts[k];
        const [tx, ty] = animate ? target(p.bx, p.by) : [p.bx, p.by];
        p.x += (tx - p.x) * EASE;
        p.y += (ty - p.y) * EASE;
        if (Math.abs(p.x - p.bx) > 0.25 || Math.abs(p.y - p.by) > 0.25)
          settled = false;
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.globalAlpha = sh.alpha;
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    return settled;
  }

  let raf = 0;
  let running = false;
  function draw() {
    running = true;
    if (paint(true)) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(draw);
  }
  function kick() {
    if (!running) raf = requestAnimationFrame(draw);
  }
  function onMove(e: MouseEvent) {
    px = e.clientX - rect.left;
    py = e.clientY - rect.top;
    active = true;
    kick();
  }
  function onLeave() {
    active = false;
    px = -9999;
    py = -9999;
    kick();
  }

  build();
  paint(false);

  const ro = new ResizeObserver(() => {
    build();
    if (reduce) paint(false);
    else kick();
  });
  ro.observe(canvas);

  if (reduce) return () => ro.disconnect();

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseout", onLeave);
  window.addEventListener("blur", onLeave);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseout", onLeave);
    window.removeEventListener("blur", onLeave);
    ro.disconnect();
  };
}

/**
 * The auth backdrop: a grid of dots plus a faint dashed sketch of the
 * apitoolchain logo motif (corner-touching squares stepping NE). Both collapse
 * toward the pointer like a small gravity well, easing back when it leaves.
 * Canvas-based and client-only — during SSR (and with reduced motion) it shows
 * the static CSS dots, matching what the canvas paints at rest.
 */
export function GravityBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cleanup = setup(canvas, ctx);
    setLive(true);
    return cleanup;
  }, []);

  return (
    <>
      {!live && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: DOT_BG,
            backgroundSize: "18px 18px",
            maskImage: MASK,
            WebkitMaskImage: MASK,
          }}
        />
      )}
      <canvas
        ref={ref}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      />
    </>
  );
}
