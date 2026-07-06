export interface LogoProps {
  /** Width & height in px (the mark is square). Defaults to 28. */
  size?: number;
  className?: string;
}

/**
 * The apitoolchain brand mark — four squares stepping up the chain. Rendered in
 * `currentColor` (transparent background) so it takes the surrounding text
 * colour and drops onto any surface.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      aria-label="apitoolchain"
      className={className}
    >
      <path d="M10.5 17.5H7V21H10.5V17.5Z" fill="currentColor" />
      <path d="M14 14.1842H10.5V17.6842H14V14.1842Z" fill="currentColor" />
      <path d="M17.5 10.5H14V14H17.5V10.5Z" fill="currentColor" />
      <path d="M21 7H17.5V10.5H21V7Z" fill="currentColor" />
    </svg>
  );
}
