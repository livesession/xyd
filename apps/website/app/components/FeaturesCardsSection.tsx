import { useState } from "react";

export function FeaturesCardsSection() {
  const [activeCard, setActiveCard] = useState(0);

  const features = [
    {
      icon: "⚠️",
      title: "Linter Integration",
      description: "If xyd generates code that doesn't pass a linter, then xyd will automatically fix the errors",
      image: "/assets/images/feature-linter.png",
    },
    {
      icon: "🔌",
      title: "Model Context Protocol (MCP)",
      description: "Enhance your AI workflows by connecting to custom tools and services",
      image: "/assets/images/feature-mcp.png",
    },
    {
      icon: "→|",
      title: "Tab to Jump",
      description: "Predicts the next location of your cursor to seamlessly navigate through the file",
      image: "/assets/images/feature-tab.png",
    },
    {
      icon: "⚡",
      title: "Supercomplete",
      description: "Supercomplete analyzes what your next edit might be, beyond just inserting the next code snippet",
      image: "/assets/images/feature-supercomplete.png",
    },
  ];

  return (
    <section className="relative bg-[#0a2540] text-white py-32">
      {/* Background gradient accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent blur-[200px]" />
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent blur-[200px]" />

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-blue-400 text-sm font-medium mb-6 tracking-wider uppercase">
            [Powerful Features]
          </p>
          <h2 className="text-5xl lg:text-6xl font-normal mb-6" style={{ letterSpacing: '1px' }}>
            The possibilities are literally endless
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              onMouseEnter={() => setActiveCard(index)}
              className={`relative p-6 rounded-2xl text-left transition-all duration-300 ${
                activeCard === index
                  ? "bg-white/10 border-2 border-white/20 shadow-xl"
                  : "bg-white/5 border-2 border-white/5 hover:bg-white/8"
              }`}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </button>
          ))}
        </div>

        {/* Feature Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-900/20 border border-white/10 shadow-2xl">
          <div className="aspect-video bg-[#1a1a2e] flex items-center justify-center">
            {/* Placeholder for feature demo */}
            <div className="text-center p-12">
              <div className="text-6xl mb-4">{features[activeCard].icon}</div>
              <h3 className="text-3xl font-semibold mb-4">{features[activeCard].title}</h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {features[activeCard].description}
              </p>
              {/* Demo content would go here */}
              <div className="mt-8 bg-[#0d1117] rounded-lg p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-left font-mono text-sm">
                  <div className="text-gray-500">// Feature demo placeholder</div>
                  <div className="text-purple-400">const <span className="text-blue-400">feature</span> = <span className="text-green-400">"{features[activeCard].title}"</span>;</div>
                  <div className="text-gray-400">console.log(feature);</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setActiveCard((prev) => (prev > 0 ? prev - 1 : features.length - 1))}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setActiveCard((prev) => (prev < features.length - 1 ? prev + 1 : 0))}
            className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center transition-all shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

