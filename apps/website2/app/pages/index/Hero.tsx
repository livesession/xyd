import { useState, useEffect, useRef } from "react";
import { HeroSVG } from "./HeroSVG";

export function Hero() {
  const [activeTab, setActiveTab] = useState(0);
  const [os, setOs] = useState<string>("Mac");
  const [isHovering, setIsHovering] = useState(false);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      setOs('Windows');
    } else if (userAgent.includes('linux')) {
      setOs('Linux');
    } else if (userAgent.includes('mac')) {
      setOs('Mac');
    } else {
      setOs('Mac'); // Default fallback
    }
  }, []);

  const tabs = [
    { 
      name: "CLI",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: "HMR",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      name: "Plugins",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      )
    },
    { 
      name: "Deploy",
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      )
    },
  ];

  // Different background images for each tab
  const tabImages = [
    "/bg1.jpeg",
    "/bg2.jpeg",
    "/bg3.png",
    "/bg4.png",
  ];

  // Different videos for each tab
  const tabVideos = [
    "/xyd-cli.mp4", // CLI
    "/xyd-hmr.mp4", // HMR
    "/xyd-plugins.mp4", // Plugins
    "/xyd-deploy.mp4", // Deploy
  ];

  return (
    <>
      <section data-theme="dark" className="relative min-h-screen bg-[#0a2540] text-white overflow-hidden">
        {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a2540]/50 to-[#0a2540]" />
      
      {/* Background SVG */}
      <div className="absolute inset-0 w-full h-full -top-[10%] lg:top-40">
        <HeroSVG className="w-full h-full object-cover" />
      </div>
      
      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 pt-[150px] pb-32 sm:pb-32 lg:flex lg:items-start lg:gap-8 lg:px-8 lg:pb-52 xl:gap-12">
        {/* Left content */}
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-lg lg:w-[45%]">
        <span className="text-6xl font-light text-white sm:text-7xl lg:text-8xl" style={{ letterSpacing: '2px' }}>
          </span>
          <h1 className="relative text-5xl sm:text-6xl font-light text-white lg:text-7xl xl:text-8xl" style={{ letterSpacing: '2px' }}>
            Docs
            <br />
            for future 
            <br />
            dev.
          </h1>
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl leading-7 sm:leading-8 text-gray-300 max-w-lg">
            Open Source documentation framework to build docs at scale.
          </p>
          
          <div className="mt-8 sm:mt-10 flex items-center gap-x-4 sm:gap-x-6">
            <button disabled className="rounded-xs bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors flex items-center gap-2">
              Download for {os}
              (soon)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          <div className="mt-6 sm:mt-8 flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 w-fit max-w-full overflow-x-auto">
            <span className="text-gray-500 flex-shrink-0">$</span>
            <code className="text-gray-300 font-mono text-xs sm:text-sm whitespace-nowrap">bun add -g xyd-js</code>
          </div>
        </div>

        {/* Right content - Image with Tabs */}
        <div className="mx-auto mt-12 sm:mt-16 flex w-full max-w-3xl sm:mt-24 lg:mt-0 lg:flex-1 lg:w-[55%] lg:min-w-0">
          <div className="relative w-full flex-none">
            {/* Image container with tabs inside */}
            <div 
              className="relative rounded-2xl overflow-hidden shadow-2xl w-full p-2 sm:p-4"
              onMouseEnter={() => {
                isHoveringRef.current = true;
                setIsHovering(true);
              }}
              onMouseLeave={() => {
                isHoveringRef.current = false;
                setIsHovering(false);
              }}
            >
              {/* Background scenic image - changes with tabs */}
              <div 
                className="w-full h-[250px] sm:h-[550px] md:h-[550px] lg:h-[450px] xl:h-[550px] bg-cover bg-center transition-all duration-700 rounded-2xl blur-2xl"
                style={{
                  backgroundImage: `url(${tabImages[activeTab]})`,
                  backgroundPosition: 'center',
                  clipPath: 'border-box',
                }}
              >
                {/* Video inside background */}
              
              </div>
               <div
                className="absolute top-0 left-0 w-full h-full rounded-lg p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12 cursor-auto"
               >
              <video 
                  key={tabVideos[activeTab]}
                  className="w-full h-auto rounded-md shadow-lg"
                  src={tabVideos[activeTab]}
                  autoPlay
                  loop={isHovering}
                  muted
                  playsInline
                  onEnded={() => {
                    if (!isHoveringRef.current) {
                      setActiveTab((prev) => (prev + 1) % tabs.length);
                    }
                  }}
                />
                </div>
              {/* Action buttons INSIDE the image at the bottom */}
              <div className="absolute bottom-3 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10 flex-wrap justify-center max-w-[95%] sm:max-w-[90%]">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    onMouseEnter={() => setActiveTab(index)}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 backdrop-blur-md cursor-pointer ${
                      activeTab === index
                        ? "bg-white text-gray-900 shadow-lg rounded-full flex items-center gap-1.5 sm:gap-2"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10 rounded-full"
                    }`}
                  >
                    {activeTab === index && tab.icon}
                    <span className="whitespace-nowrap">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex mx-auto flex-col items-center justify-center flex-row gap-2">
      <div className="h-[6px] w-[6px] bg-blue-500"></div>
      <p className="text-gray-100 text-sm font-extralight tracking-wide">
        We built xyd to make documentation easier and more accessible for everyone.
        </p>
        </div>
      </section>
    </>
  );
}