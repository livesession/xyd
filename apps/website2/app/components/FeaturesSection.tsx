export function FeaturesSection() {
  return (
    <section data-theme="dark" className="relative bg-[#0a2540] text-white py-24">
      {/* Gradient background accent - Right */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-purple-500/20 via-blue-500/20 to-transparent blur-[200px]" />
      
      {/* Gradient background accent - Left */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent blur-[200px]" />
      
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Top section */}
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium mb-6 tracking-wider uppercase">
            [Explore the features]
          </p>
          <h2 className="text-6xl lg:text-7xl font-normal mb-8" style={{ letterSpacing: '1px' }}>
            Cascade
          </h2>
          <p className="text-gray-300 text-lg max-w-4xl mx-auto leading-relaxed">
            Cascade combines deep codebase understanding, a breadth of advanced tools, and a real-time awareness of your actions into a powerful, seamless, and collaborative flow. It is the most powerful way to code with AI.
          </p>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-16" />

        {/* Bottom section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <h3 className="text-4xl lg:text-5xl font-normal mb-6 leading-tight">
              Cascade, an agent that codes, fixes and thinks 10 steps ahead
            </h3>
          </div>
          <div>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Built to keep you in flow by understanding your intent and handling the complex codebases so you can focus on the fun stuff.
            </p>
            <a 
              href="#" 
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
            >
              Explore Cascade Features
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Video Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl p-4 max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 h-[85vh]">
            {/* Video Element */}
            <video 
              className="w-full h-full object-cover"
              poster="https://raw.githubusercontent.com/livesession/xyd/master/.github/assets/readme-hero.png"
              controls
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Play Button Overlay (hidden when video is playing) */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <button className="pointer-events-auto w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-2xl transition-all hover:scale-110">
                <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

