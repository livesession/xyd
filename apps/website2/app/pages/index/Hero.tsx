import { useState } from "react";
import { HeroSVG } from "./HeroSVG";
import { Navbar } from "../../components/Navbar";
import { FeaturesSection } from "../../components/FeaturesSection";
import { BentoSection } from "../../components/BentoSection";

export function Hero() {
  const [activeTab, setActiveTab] = useState(3);

  const tabs = [
    { name: "Build features" },
    { name: "Fix bugs" },
    { name: "Debug prod" },
    { name: "Understand your codebase" },
  ];

  // Different background images for each tab
  const tabImages = [
    "https://framerusercontent.com/images/xXngDcniCg8lk0urG3eUnn7DM.png?width=1024&height=1024",
    "https://framerusercontent.com/images/RMqKY0X6mt3bcUoHUnlZxTRa4E0.png?width=1024&height=1024",
    "https://framerusercontent.com/images/xXngDcniCg8lk0urG3eUnn7DM.png?width=1024&height=1024",
    "https://framerusercontent.com/images/RMqKY0X6mt3bcUoHUnlZxTRa4E0.png?width=1024&height=1024",
  ];

  return (
    <>
      <Navbar />
      <section data-theme="dark" className="relative min-h-screen bg-[#0a2540] text-white overflow-hidden rounded-t-3xl">
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
      <div className="absolute inset-0 w-full h-full opacity-90 top-40">
        <HeroSVG className="w-full h-full object-cover" />
      </div>
      
      <div className="relative mx-auto max-w-[1600px] px-6 pt-[200px] pb-24 sm:pb-32 lg:flex lg:px-8 lg:pb-40">
        {/* Left content */}
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-lg">
          <h1 className="text-6xl font-light text-white sm:text-7xl lg:text-8xl" style={{ letterSpacing: '2px' }}>
            Docs
            <br />
            for tommorow
          </h1>
          <p className="mt-8 text-xl leading-8 text-gray-200 max-w-lg">
            Open source documentation framework for future dev.
          </p>
          
          <div className="mt-10 flex items-center gap-x-6">
            <button className="rounded-xs bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors flex items-center gap-2">
              Download for Mac
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800 w-fit">
            <span className="text-gray-500">$</span>
            <code className="text-gray-300 font-mono text-sm">bun add -g xyd-js</code>
          </div>
        </div>

        {/* Right content - Image with Tabs */}
        <div className="mx-auto mt-16 flex max-w-3xl sm:mt-24 lg:ml-20 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="relative max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            {/* Image container with tabs inside */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl min-w-[800px] p-4">
              {/* Background scenic image - changes with tabs */}
              <div 
                className="w-full h-[550px] bg-cover bg-center transition-all duration-700 rounded-2xl"
                style={{
                  backgroundImage: `url(${tabImages[activeTab]})`,
                  backgroundPosition: 'center',
                }}
              />

              {/* Action buttons INSIDE the image at the bottom */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    onMouseEnter={() => setActiveTab(index)}
                    className={`px-5 py-2.5 text-sm font-medium transition-all duration-300 backdrop-blur-md cursor-pointer ${
                      activeTab === index
                        ? "bg-white text-gray-900 shadow-lg rounded-full flex items-center gap-2"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10 rounded-full"
                    }`}
                  >
                    {activeTab === index && (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                    <span className="whitespace-nowrap">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    
      </section>
      <FeaturesSection />
      <BentoSection />
    </>
  );
}