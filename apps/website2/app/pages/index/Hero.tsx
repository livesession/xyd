import { useState, useEffect, useRef } from "react";
import { HeroSVG } from "./HeroSVG";

export function Hero() {
  const [activeTab, setActiveTab] = useState(0);
  const [os, setOs] = useState<string>("Mac");
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const floatingMenuRef = useRef<HTMLDivElement>(null);

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

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  // Close floating menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingMenuRef.current && !floatingMenuRef.current.contains(event.target as Node)) {
        setShowFloatingMenu(false);
      }
    };

    if (showFloatingMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFloatingMenu]);

  // Control video playback when switching tabs
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      
      if (index === activeTab) {
        // Play the active video
        video.currentTime = 0; // Reset to beginning
        video.play().catch((err) => {
          console.log("Video play prevented:", err);
        });
      } else {
        // Pause inactive videos
        video.pause();
      }
    });
  }, [activeTab]);

  const tabs = [
    {
      name: "CLI",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "HMR",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "Plugins",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      ),
    },
    {
      name: "Deploy",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      ),
    },
  ];

  // Different background images for each tab (WebP for better performance)
  const tabImages = [
    "/hero--bg1.webp",
    "/hero--bg2.webp",
    "/hero--bg3.webp",
    "/hero--bg4.webp",
  ];

  // Different videos for each tab
  const tabVideos = [
    "/hero--cli.mp4", // CLI
    "/hero--hmr.mp4", // HMR
    "/hero--plugins.mp4", // Plugins
    "/hero--deploy.mp4", // Deploy
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("bun add -g xyd-js");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <section
        data-theme="dark"
        className="relative min-h-screen bg-[#0a2540] text-white overflow-hidden"
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a2540]/50 to-[#0a2540]" />

        {/* Background SVG */}
        <div className="absolute inset-0 w-full h-full -top-[10%] lg:top-40">
          <HeroSVG className="w-full h-full object-cover" />
        </div>

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 pt-[150px] pb-24 sm:pb-24 lg:flex lg:items-start lg:gap-8 lg:px-8 lg:pb-52 xl:gap-12">
          {/* Left content */}
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-lg lg:w-[45%]">
            <span
              className="text-6xl font-light text-white sm:text-7xl lg:text-8xl"
              style={{ letterSpacing: "2px" }}
            ></span>
            <h1
              className="relative text-5xl sm:text-6xl font-light text-white lg:text-7xl xl:text-8xl"
              style={{ letterSpacing: "2px" }}
            >
              Docs
              <br />
              for future
              <br />
              dev.
            </h1>
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl leading-7 sm:leading-8 text-gray-300 max-w-lg">
              Open Source framework to build beautiful docs.
            </p>

            <div className="mt-6 sm:mt-8 relative inline-flex">
              <div 
                onClick={() => setShowTooltip(!showTooltip)}
                className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 w-fit max-w-full overflow-x-auto group cursor-pointer hover:bg-gray-900/70 transition-all duration-200"
              >
                <span className="text-gray-500 flex-shrink-0">$</span>
                <code className="text-gray-300 font-mono text-xs sm:text-sm whitespace-nowrap">
                  bun add -g xyd-js
                </code>
                <div className={`ml-2 flex-shrink-0 p-1.5 rounded transition-all duration-200 group-hover:scale-110 ${
                  showTooltip ? 'bg-white scale-110' : 'bg-gray-800 group-hover:bg-white'
                }`}>
                  {copied ? (
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className={`w-4 h-4 transition-colors duration-200 ${
                        showTooltip ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Tooltip */}
              {showTooltip && (
                <div ref={tooltipRef} className="absolute left-full top-0 ml-1 w-64 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 z-2">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleCopy();
                        setShowTooltip(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white text-left cursor-pointer"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Copy Command</span>
                    </button>
                    
                    <div className="h-px bg-gray-700/50 my-1" />
                    
                    <a
                      href="https://app.netlify.com/start/deploy?repository=https://github.com/xyd-js/deploy-samples&base=netlify"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowTooltip(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 128 113" fill="currentColor">
                        <path d="M34.6,94.2h-1.2l-6-6V87l9.2-9.2H43l0.9,0.9V85L34.6,94.2z"/>
                        <path d="M27.4,26v-1.2l6-6h1.2l9.2,9.2v6.4L43,35.2h-6.4L27.4,26z"/>
                        <path d="M80.5,74.8h-8.8L70.9,74V53.5c0-3.7-1.4-6.5-5.8-6.6c-2.3-0.1-4.9,0-7.6,0.1l-0.4,0.4V74l-0.7,0.7h-8.8L46.8,74V38.9l0.7-0.7h19.8c7.7,0,13.9,6.2,13.9,13.9V74L80.5,74.8z"/>
                        <path d="M35.8,61.6H0.7L0,60.9v-8.8l0.7-0.7h35.1l0.7,0.7v8.8L35.8,61.6z"/>
                        <path d="M127.3,61.6H92.2l-0.7-0.7v-8.8l0.7-0.7h35.1l0.7,0.7v8.8L127.3,61.6z"/>
                        <path d="M58.9,27.2V0.9l0.7-0.7h8.8l0.7,0.7v26.3L68.5,28h-8.8L58.9,27.2z"/>
                        <path d="M58.9,112.1V85.7l0.7-0.7h8.8l0.7,0.7v26.3l-0.7,0.7h-8.8L58.9,112.1z"/>
                      </svg>
                      <span className="text-sm font-medium">Deploy to Netlify</span>
                    </a>
                    
                    <a
                      href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxyd-js%2Fdeploy-samples%2Ftree%2Fmaster%2Fvercel"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowTooltip(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 256 222" fill="currentColor">
                        <polygon points="128 0 256 221.705007 0 221.705007"/>
                      </svg>
                      <span className="text-sm font-medium">Deploy to Vercel</span>
                    </a>
                    
                    <div className="h-px bg-gray-700/50 my-1" />
                    
                    <a
                      href="https://codesandbox.io/p/github/xyd-js/deploy-samples-codesandbox"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowTooltip(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 6l10.455-6L22.91 6 23 17.95 12.455 24 2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144 7.32-4.18-3.871-2.197-3.41 1.945-3.43-1.968L5.133 6.6z"/>
                      </svg>
                      <span className="text-sm font-medium">Edit in CodeSandbox</span>
                    </a>
                    
                    <a
                      href="https://github.com/xyd-js/starter"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowTooltip(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="text-sm font-medium">View Starter Template</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 sm:mt-10 flex items-center gap-x-4 sm:gap-x-6">
              <a
                href="https://github.com/livesession/xyd/pull/63"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xs bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors flex items-center gap-2"
              >
                Download for {os}
                (soon)
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Right content - Image with Tabs */}
          <div className="mx-auto mt-12 sm:mt-16 flex w-full max-w-3xl sm:mt-24 lg:mt-0 lg:flex-1 lg:w-[55%] lg:min-w-0">
            <div className="relative w-full flex-none">
              {/* Image container with tabs inside */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full p-2 sm:p-4">
                {/* Background scenic images - render all, show active with lazy loading */}
                {tabImages.map((image, index) => (
                  <img
                    key={`bg-${index}`}
                    src={image}
                    alt={`${tabs[index].name} background`}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "low"}
                    sizes="(max-width: 768px) 100vw, 656px"
                    width="1024"
                    height="1024"
                    className={`absolute top-0 left-0 h-full w-full object-cover object-center transition-opacity duration-700 rounded-2xl ${
                      activeTab === index ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      pointerEvents: activeTab === index ? "auto" : "none",
                    }}
                  />
                ))}

                {/* Render all videos but only show active one */}
                <div className="relative top-0 left-0 w-full h-full rounded-lg p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12 cursor-auto">
                  <div className="relative w-full">
                    {tabVideos.map((videoSrc, index) => (
                      <video
                        key={`video-${index}`}
                        ref={(el) => {
                          videoRefs.current[index] = el;
                        }}
                        className={`w-full h-auto rounded-md shadow-lg transition-opacity duration-300 ${
                          activeTab === index ? "opacity-100 relative" : "opacity-0 absolute top-0 left-0"
                        }`}
                        src={videoSrc}
                        muted
                        playsInline
                        preload={index === 0 ? "auto" : "metadata"}
                        onEnded={() => {
                          if (activeTab === index) {
                            setActiveTab((prev) => (prev + 1) % tabs.length);
                          }
                        }}
                      >
                        <track kind="captions" />
                      </video>
                    ))}
                  </div>
                </div>
                {/* Action buttons INSIDE the image at the bottom */}
                <div className="w-full relative bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10 flex-wrap justify-center max-w-[95%] sm:max-w-[90%]">
                  {tabs.map((tab, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      onMouseEnter={() => setActiveTab(index)}
                      className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 backdrop-blur-md cursor-pointer rounded-full flex items-center overflow-hidden ${
                        activeTab === index
                          ? "bg-white text-gray-900 shadow-lg gap-1.5 sm:gap-2"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/10 gap-0"
                      }`}
                    >
                      <span className={`inline-flex transition-all duration-300 ${
                        activeTab === index 
                          ? "w-[14px] opacity-100 mr-0" 
                          : "w-0 opacity-0 -mr-1"
                      }`}>
                        {tab.icon}
                      </span>
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex mx-auto flex-col items-center justify-center flex-row gap-2 px-6">
          <div className="h-[6px] w-[6px] bg-blue-500"></div>
          <p className="text-gray-100 text-sm font-extralight tracking-wide">
            We built xyd to make documentation easier and more accessible for
            everyone.
          </p>
        </div>
      </section>

      {/* Floating Deploy Button - Fixed to bottom right */}
      <div className="fixed bottom-8 right-8 z-50" ref={floatingMenuRef}>
        <button
          onClick={() => setShowFloatingMenu(!showFloatingMenu)}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
            showFloatingMenu 
              ? 'bg-white text-gray-900 scale-110' 
              : 'bg-gray-900 text-white hover:scale-110 hover:bg-gray-800'
          }`}
          aria-label="Deploy options"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: 'translateX(0.5px) translateY(-0.5px)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
            />
          </svg>
        </button>

        {/* Floating Menu */}
        {showFloatingMenu && (
          <div className="absolute bottom-full right-0 mb-4 w-64 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="py-2">
              <a
                href="https://app.netlify.com/start/deploy?repository=https://github.com/xyd-js/deploy-samples&base=netlify"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowFloatingMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 128 113" fill="currentColor">
                  <path d="M34.6,94.2h-1.2l-6-6V87l9.2-9.2H43l0.9,0.9V85L34.6,94.2z"/>
                  <path d="M27.4,26v-1.2l6-6h1.2l9.2,9.2v6.4L43,35.2h-6.4L27.4,26z"/>
                  <path d="M80.5,74.8h-8.8L70.9,74V53.5c0-3.7-1.4-6.5-5.8-6.6c-2.3-0.1-4.9,0-7.6,0.1l-0.4,0.4V74l-0.7,0.7h-8.8L46.8,74V38.9l0.7-0.7h19.8c7.7,0,13.9,6.2,13.9,13.9V74L80.5,74.8z"/>
                  <path d="M35.8,61.6H0.7L0,60.9v-8.8l0.7-0.7h35.1l0.7,0.7v8.8L35.8,61.6z"/>
                  <path d="M127.3,61.6H92.2l-0.7-0.7v-8.8l0.7-0.7h35.1l0.7,0.7v8.8L127.3,61.6z"/>
                  <path d="M58.9,27.2V0.9l0.7-0.7h8.8l0.7,0.7v26.3L68.5,28h-8.8L58.9,27.2z"/>
                  <path d="M58.9,112.1V85.7l0.7-0.7h8.8l0.7,0.7v26.3l-0.7,0.7h-8.8L58.9,112.1z"/>
                </svg>
                <span className="text-sm font-medium">Deploy to Netlify</span>
              </a>
              
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxyd-js%2Fdeploy-samples%2Ftree%2Fmaster%2Fvercel"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowFloatingMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 256 222" fill="currentColor">
                  <polygon points="128 0 256 221.705007 0 221.705007"/>
                </svg>
                <span className="text-sm font-medium">Deploy to Vercel</span>
              </a>
              
              <div className="h-px bg-gray-700/50 my-1" />
              
              <a
                href="https://codesandbox.io/p/github/xyd-js/deploy-samples-codesandbox"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowFloatingMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 6l10.455-6L22.91 6 23 17.95 12.455 24 2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144 7.32-4.18-3.871-2.197-3.41 1.945-3.43-1.968L5.133 6.6z"/>
                </svg>
                <span className="text-sm font-medium">Edit in CodeSandbox</span>
              </a>
              
              <a
                href="https://github.com/xyd-js/starter"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowFloatingMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-gray-200 hover:text-white group"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-medium">View Starter Template</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

