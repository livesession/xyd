import { useEffect, useState, useRef } from "react";
import { IconMac } from "~/icons/Mac";
import { IconWindows } from "~/icons/Windows";
import { IconLinux } from "~/icons/Linux";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [os, setOs] = useState<string>("Mac");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      setOs("Windows");
    } else if (userAgent.includes("linux")) {
      setOs("Linux");
    } else if (userAgent.includes("mac")) {
      setOs("Mac");
    } else {
      setOs("Mac"); // Default fallback
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const linkClass =
    "text-md text-gray-900 hover:text-purple-400 transition-colors duration-500";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 my-4 md:my-8 px-6 lg:px-8">
      <div
        ref={navRef}
        className="mx-auto max-w-[calc(100%-3rem)] xl:max-w-[1600px]"
      >
        <div className="rounded-lg bg-[#0a2540]/80-X backdrop-blur-md-X relative">
          <div className="site-header-bg"/>
          <div className="px-4 md:px-6 lg:px-8 w-full relative z-10">
            <div className="flex h-14 items-center justify-between">
              {/* Logo */}
              <a
                href="/"
                className="flex items-center gap-2 transition-all duration-500 flex-shrink-0"
                aria-label="xyd Home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={64}
                  height={18}
                  viewBox="0 0 64 18"
                  fill="none"
                  className="transition-all duration-500 w-12 md:w-16"
                >
                  <g clipPath="url(#clip0_3_18)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.9447 14.7921H10.6636L14.2428 9.73069L10.8861 4.9901H13.1857L14.9846 7.69901C15.0712 7.84158 15.1577 7.99307 15.2443 8.15347C15.2649 8.1918 15.2854 8.23023 15.3057 8.26877C15.3598 8.37166 15.4048 8.46149 15.4407 8.53824C15.4432 8.54364 15.4458 8.54904 15.4483 8.55446C15.4611 8.51802 15.4751 8.482 15.4904 8.44646C15.5265 8.36139 15.5743 8.26372 15.6337 8.15347C15.7203 7.99307 15.8068 7.84158 15.8934 7.69901L17.6923 4.9901H19.9919L16.6352 9.74852L20.1959 14.7921H17.8963L15.9119 11.8515C15.8254 11.7089 15.7388 11.5485 15.6523 11.3703C15.6317 11.328 15.6113 11.2857 15.5909 11.2434C15.551 11.1606 15.516 11.0873 15.4861 11.0237C15.4734 10.9967 15.4608 10.9696 15.4483 10.9426C15.3988 11.0495 15.3277 11.1921 15.235 11.3703C15.1851 11.4666 15.1319 11.5613 15.0755 11.6542C15.0349 11.7212 14.9922 11.7869 14.9476 11.8515L12.9447 14.7921ZM26.2973 18H24.1831L25.6482 14.2218L21.8464 4.9901H24.0533L26.186 10.5149C26.2523 10.6968 26.3186 10.9065 26.3848 11.1441C26.4058 11.2194 26.426 11.2947 26.4457 11.3703C26.5322 11.703 26.6064 11.9762 26.6682 12.1901C26.7125 11.9988 26.7716 11.76 26.8455 11.4737C26.8544 11.4392 26.8633 11.4047 26.8722 11.3703C26.9588 11.0376 27.0453 10.7525 27.1318 10.5149L29.1347 4.9901H31.2675L26.2973 18ZM33.5671 11.2812V8.51881C33.5671 8.5099 33.5671 8.50099 33.5671 8.49208C33.5713 7.51129 33.8055 6.70741 34.2698 6.08044C34.3394 5.98635 34.4144 5.89603 34.4943 5.8099C35.1125 5.14455 35.9347 4.81188 36.9609 4.81188C37.2432 4.80978 37.5248 4.83873 37.8002 4.89814C38.2353 4.98873 38.637 5.18972 38.9638 5.4802C39.4583 5.92574 39.7056 6.53465 39.7056 7.30693L39.279 6.86139H39.7427L39.687 4.5802V1.78218H41.6899V14.7921H39.7056V12.9208H39.279L39.7056 12.4752C39.7079 12.7346 39.6757 12.9931 39.6097 13.2446C39.5048 13.6495 39.2805 14.0166 38.9638 14.302C38.637 14.5925 38.2353 14.7935 37.8002 14.884C37.5248 14.9435 37.2432 14.9724 36.9609 14.9703C36.5745 14.9741 36.19 14.9196 35.8213 14.8087C35.3085 14.6502 34.8499 14.3611 34.4943 13.9723C33.8762 13.3069 33.5671 12.4099 33.5671 11.2812ZM2.07708 16.7525H0L6.52796 0H8.60504L2.07708 16.7525ZM64 9.92673L55.8771 13.7228V11.905L61.4222 9.35644C61.5629 9.29538 61.7054 9.23815 61.8495 9.18481C61.9412 9.15093 62.0337 9.11902 62.1269 9.08911C62.3475 9.01842 62.5134 8.97113 62.6247 8.94725C62.6257 8.94701 62.6267 8.94677 62.6276 8.94653C62.5884 8.93886 62.5495 8.93007 62.5108 8.92016C62.4265 8.89877 62.3263 8.86931 62.2102 8.83176C62.1731 8.81976 62.136 8.80752 62.0991 8.79505C61.8704 8.71782 61.6447 8.62574 61.4222 8.51881L55.8771 5.9703V4.11683L64 7.91287V9.92673ZM39.687 11.1743V8.60792C39.6886 8.39594 39.6672 8.18438 39.6231 7.97667C39.5654 7.71481 39.4687 7.48414 39.3328 7.28465C39.2758 7.20072 39.2112 7.12171 39.14 7.04852C38.8659 6.76894 38.503 6.58461 38.1083 6.52438C37.956 6.49891 37.8016 6.48645 37.6471 6.48713C37.4323 6.48547 37.218 6.50802 37.0087 6.55432C36.6672 6.62705 36.3545 6.79238 36.1078 7.03069C35.9021 7.23549 35.7516 7.48556 35.6696 7.75907C35.6117 7.94145 35.5751 8.14248 35.5598 8.36216C35.5541 8.44397 35.5514 8.52593 35.5514 8.60792V11.1743C35.55 11.3795 35.5691 11.5844 35.6086 11.7861C35.6563 12.0212 35.734 12.2299 35.8419 12.4122C35.9147 12.5359 36.0041 12.65 36.1078 12.7515C36.3578 12.9928 36.6752 13.1594 37.0217 13.2309C37.2269 13.2751 37.4367 13.2966 37.6471 13.2951C37.8632 13.2969 38.0786 13.2714 38.2878 13.2193C38.6141 13.1386 38.9098 12.9701 39.14 12.7337C39.4759 12.389 39.6571 11.9209 39.6837 11.3295C39.686 11.2778 39.6871 11.226 39.687 11.1743Z"
                      fill={"var(--color-gray-900)"}
                      stroke={"var(--color-gray-900)"}
                      strokeWidth={0.944882}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_3_18">
                      <rect width={64} height={18} fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </a>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm xl:text-base">
                <a
                  href="https://docs.xyd.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Documentation
                </a>
                <a
                  href="https://xyd.dev/docs/resources/showcase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Showcase
                </a>
                <a
                  href="https://github.com/xyd-js/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Examples
                </a>
                <a
                  href="https://github.com/orgs/livesession/projects/4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Roadmap
                </a>
                <a
                  href="https://join.slack.com/t/xyd-docs/shared_invite/zt-3brqammx1-qVPwQ8~gYFgocioExxHA2A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Community
                </a>
              </div>

              {/* Right side buttons */}
              <div className="hidden lg:flex items-center gap-3 xl:gap-4">
                <a
                  href="https://github.com/livesession/xyd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub
                </a>
                <a 
                  href="https://github.com/livesession/xyd/pull/63" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xs bg-gray-800 px-3 xl:px-4 py-2 text-sm xl:text-base font-normal text-gray-100 shadow-sm hover:bg-gray-700 transition-colors whitespace-nowrap inline-flex items-center gap-2"
                >
                  {os === "Mac" && <IconMac className="w-4 h-4 relative -top-0.5" fill="var(--color-gray-100)" />}
                  {os === "Windows" && <IconWindows className="w-4 h-4 relative -top-0.5" fill="var(--color-gray-100)" />}
                  {os === "Linux" && <IconLinux className="w-4 h-4 relative -top-0.5" fill="var(--color-gray-100)" />}
                  Download (soon)
                </a>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden transition-colors duration-500 text-gray-900`}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="lg:hidden py-4 border-t border-gray-700/20 mt-2">
                <div className="flex flex-col gap-4 text-sm">
                  <a
                    href="https://docs.xyd.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Documentation
                  </a>
                  <a
                    href="https://xyd.dev/docs/resources/showcase"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Showcase
                  </a>
                  <a
                    href="https://github.com/xyd-js/examples"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Examples
                  </a>
                  <a
                    href="https://github.com/orgs/livesession/projects/4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Roadmap
                  </a>
                  <a
                    href="https://join.slack.com/t/xyd-docs/shared_invite/zt-3brqammx1-qVPwQ8~gYFgocioExxHA2A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Community
                  </a>
                  <a
                    href="https://github.com/livesession/xyd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    GitHub
                  </a>
                  <a 
                    href="https://github.com/livesession/xyd/pull/63" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xs bg-gray-800 px-4 py-2 text-md font-normal text-gray-100 shadow-sm hover:bg-gray-700 transition-colors text-left inline-flex items-center gap-2 w-full"
                  >
                    {os === "Mac" && <IconMac className="w-4 h-4 relative -top-0.5" fill="white" />}
                    {os === "Windows" && <IconWindows className="w-4 h-4 relative -top-0.5" fill="white" />}
                    {os === "Linux" && <IconLinux className="w-4 h-4 relative -top-0.5" fill="white" />}
                    Download (soon)
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
