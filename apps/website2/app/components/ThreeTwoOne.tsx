import { useEffect, useRef, useState } from "react";

export function FeaturesSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
      }
    };

    // Update progress when metadata is loaded
    const handleLoadedMetadata = () => {
      updateProgress();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((error) => {
              console.log("Auto-play was prevented:", error);
            });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the video is visible
      }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      observer.disconnect();
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  return (
    <section
      data-theme="dark"
      className="relative bg-[#0a2540] text-white py-24 rounded-b"
    >
      {/* Gradient background accent - Right */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-purple-500/20 via-blue-500/20 to-transparent blur-[200px]" />

      {/* Gradient background accent - Left */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent blur-[200px]" />

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Top section */}
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium mb-6 tracking-widest uppercase">
            [ Let's dive in ]
          </p>
          <h2
            className="text-6xl lg:text-7xl font-normal mb-8"
            style={{ letterSpacing: "1px" }}
          >
            Docs in three, two, one...
            <br />
          </h2>
          <p className="text-gray-300 text-lg max-w-4xl mx-auto leading-relaxed">
            Built from ground up to build docs at ease. Simple config, zero
            hassle. Zero learning curve. Built-in themes, plugins, and
            components to get you started.
          </p>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-16" />

        {/* Bottom section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <h3 className="text-4xl lg:text-5xl font-normal mb-6 leading-tight">
              You can ship docs in minutes, not days. Do what's the most matter
              — content.
            </h3>
          </div>
          <div>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Built with love and care to make documentation easier <br />
              and more accessible for everyone.
            </p>
            <a
              href="https://xyd.dev/docs/guides/introduction"
              target="_blank"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
            >
              Explore Features
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Video Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-4 max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20">
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              poster="./three-two-one--video-thumb.webp"
              width="3105"
              height="2160"
              loop
              muted
              playsInline
            >
              <source src="./three-two-one.mp4" type="video/mp4" />
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>

            {/* Circular Progress Indicator - Top Right Corner */}
            <button
              onClick={togglePlayPause}
              className="absolute top-4 right-4 cursor-pointer hover:scale-110 transition-transform bg-black/70 rounded-full"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 64 64">
                {/* Background circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  className="transition-all duration-200"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Play/Pause icon in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isPlaying ? (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-white ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
