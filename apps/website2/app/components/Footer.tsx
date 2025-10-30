export function Footer() {
  return (
    <footer className="bg-white md:border-t border-gray-200 py-8">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left side - Links */}
          <div className="flex items-center gap-8">
          
          <a
              target="_blank"
              href="https://github.com/livesession"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
               LiveSession OpenSource ®
            </a>

            <a
              target="_blank"
              href="https://livesession.io/privacy-policy"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              Privacy policy
            </a>
            <a
              target="_blank"
              href="https://livesession.io/terms-of-service"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              Terms of service
            </a>
          </div>

          {/* Right side - Social Links */}
          <div className="flex items-center gap-8">
            <a
              href="https://github.com/livesession/xyd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              GitHub ↗
            </a>
            <a
              href="https://x.com/LiveSessionDev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              X (Twitter) ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
