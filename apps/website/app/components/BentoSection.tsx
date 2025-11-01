// bg-cover bg-center bg-no-repeat bg-[url('/gradient1.png')]
export function BentoSection() {
  return (
    <section className="relative bg-white text-gray-900 py-24 mt-12 rounded mb-12">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2
            className="text-5xl lg:text-7xl font-normal mb-6 text-gray-900"
            style={{ letterSpacing: "1px" }}
          >
            [superpowered
            <br />
            docs]
          </h2>
        </div>

        <div className="o-grid" id="home-bento__wrapper">
          <div className="home-bento__item" id="home-bento__item-01">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <span className="relative">
                  <span className="hidden lg:flex font-normal text-3xl absolute -left-10 top-1 flex h-full -top-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                    {"#"}
                  </span>
                  <h3 className="relative home-bento__item-title bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                    Framework for customizations++
                  </h3>
                </span>
                <p className="home-bento__item-subtitle">
                  <span className="hidden lg:flex font-normal text-sm absolute -left-8 top-1">
                    {"##"}
                  </span>
                  Let you customize it to your needs.
                </p>
                <a
                  href="https://xyd.dev/docs/guides/customization-quickstart"
                  target="_blank"
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium uppercase text-xs tracking-wider inline-block"
                >
                  [ Learn more about customization ↗ ]
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <img
                  alt="Customization image"
                  src="./bento--customization.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <img
                  alt="Customization image"
                  src="./bento--customization.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <div className="home-bento__item" id="home-bento__item-02">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <span className="relative">
                  <span className="hidden lg:flex font-normal text-3xl absolute -left-10 top-1 flex h-full -top-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                    {"#"}
                  </span>
                  <h3 className="relative home-bento__item-title bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                    Docs on the go++
                  </h3>
                </span>
                <p className="home-bento__item-subtitle">
                  <span className="hidden lg:flex font-normal text-sm absolute -left-8 top-1">
                    {"##"}
                  </span>
                  Supports MD/MDX, SEO tags, code highlighting, search, dark
                  mode and more. <br />
                </p>
                <a
                  href="https://xyd.dev/docs/guides/writing-quickstart"
                  target="_blank"
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium uppercase text-xs tracking-wider inline-block"
                >
                  [ Learn more about writing docs ↗ ]
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <img
                  alt="Docs on the go image"
                  src="./bento--docs-on-the-go.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <img
                  alt="Docs on the go image"
                  src="./bento--docs-on-the-go.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <div className="home-bento__item" id="home-bento__item-03">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <span className="relative">
                  <span className="hidden lg:flex font-normal text-3xl absolute -left-10 top-1 flex h-full -top-1.5 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-shimmer-reverse bg-[length:200%_100%]">
                    {"#"}
                  </span>
                  <h3 className="relative home-bento__item-title bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-shimmer-reverse bg-[length:200%_100%]">
                    OpenAPI, GraphQL & <br />
                    SDK generation++
                  </h3>
                </span>
                <p className="home-bento__item-subtitle">
                  <span className="hidden lg:flex font-normal text-sm absolute -left-8 top-1">
                    {"##"}
                  </span>
                  Automatic documentation generation from API specs.
                </p>
                <a
                  href="https://xyd.dev/docs/guides/openapi"
                  target="_blank"
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium uppercase text-xs tracking-wider inline-block"
                >
                  [ Learn more about API docs ↗ ]
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <img
                  alt="API Docs image"
                  src="./bento--api-docs.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <img
                  alt="API Docs image"
                  src="./bento--api-docs.webp"
                  width="1200"
                  height="800"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
