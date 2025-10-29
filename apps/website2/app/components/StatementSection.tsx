export function StatementSection() {
  return (
    <section className="relative bg-white text-white py-32 min-h-[60vh] flex items-center justify-center rounded mt-12">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8 text-center">
        <div className="mb-12">
          <p className="text-purple-400 text-sm font-medium mb-6 tracking-widest uppercase">
            [ Statement ]
          </p>
          <h2 className="text-xl lg:text-3xl font-light tracking-wide leading-relaxed mb-6 text-gray-900">
            It's a new era of software.
            <br />
            It's also a time for a new era of documentation.
            <br />
            Built from ground up to build docs at scale.
            <sup className="text-purple-400 ml-2 transition-colors font-medium uppercase text-xs tracking-wider select-none">
              [MIT LICENSE]
            </sup>
            <hr className="my-4 border-gray-300" />
          </h2>
          <h2 className="text-xl lg:text-3xl font-light tracking-wide leading-relaxed mb-6 text-gray-900 flex items-center justify-center gap-2">
            Brought to you by{" "}
            <a
              href="https://livesession.io"
              target="_blank"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
            >
              LiveSession
            </a>
          </h2>
        </div>
      </div>
    </section>
  );
}
