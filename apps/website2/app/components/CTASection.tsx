import { IconLinux, IconWindows, IconChrome, IconMac } from "~/icons";
import { useState, useEffect } from "react";

export function CTASection() {
  const [os, setOs] = useState<string>("");

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

  const getOSIcon = () => {
    switch (os) {
      case "Windows":
        return <IconWindows className="inline-block md:h-8 md:w-8 h-6 w-6" />;
      case "Linux":
        return <IconLinux className="inline-block md:h-8 md:w-8 h-6 w-6" />;
      case "Mac":
      default:
        return <IconMac className="inline-block md:h-8 md:w-8 h-6 w-6" />;
    }
  };

  return (
    <section className="relative bg-white py-24 sm:py-32 sm:pb-42 overflow-hidden clip-rounded-top">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Gradient orbs for visual interest */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-purple-600 text-sm font-medium mb-6 tracking-widest uppercase">
            [ TRY IT NOW ]
          </p>

          <h2
            className="text-4xl lg:text-6xl font-light text-black mb-6"
            style={{ letterSpacing: "1px" }}
          >
            Feel breeze to build <br/> docs at ease. <br />
          </h2>

          <p
            className="flex items-center justify-center text-xl font-light text-gray-600 md:text-2xl lg:text-3xl mb-4"
            style={{ letterSpacing: "0.5px" }}
          >
            Soon available for 
            <span className="inline-block mx-2"/>
            <IconChrome className="inline-block md:h-8 md:w-8 h-6 w-6" />
            <span className="inline-block">/</span>
            {getOSIcon()}
          </p>

          <p className="flex items-center justify-center text-base text-gray-400 sm:text-lg mb-2">
            Open Source.
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-white/10 backdrop-blur-sm rounded">
              [MIT LICENSE]
            </span>
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://xyd.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-900 bg-white rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <svg
                className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </a>

            <a
              href="https://github.com/livesession/xyd"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-black bg-black/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-black/10 hover:border-white/20 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-black">View on GitHub</span>
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Brought to you by{" "}
              <a
                href="https://livesession.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                LIVESESSION ↗
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
