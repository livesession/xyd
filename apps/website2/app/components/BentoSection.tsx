// bg-cover bg-center bg-no-repeat bg-[url('/gradient1.png')]
export function BentoSection() {
  return (
    <section className="relative bg-white text-gray-900 py-24 mt-12 rounded mb-12">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2
            className="text-6xl lg:text-7xl font-normal mb-6 text-gray-900"
            style={{ letterSpacing: "1px" }}
          >
            [every docs
            <br />
            at scale]
          </h2>
        </div>

        <div className="o-grid" id="home-bento__wrapper">
          <div className="home-bento__item" id="home-bento__item-01">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <h3 className="home-bento__item-title">
                  Framework for customizations
                </h3>
                <p className="home-bento__item-subtitle">
                  Let you customize it to your needs.
                </p>
                <a
                  href="https://xyd.dev/docs/guides/customization-quickstart"
                  target="_blank"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
                >
                  Learn more
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame3.png" />
                  <img alt="visual" src="./frame3.png" />
                </picture>
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame3.png" />
                  <img alt="visual" src="./frame3.png" />
                </picture>
              </div>
            </div>
          </div>
          <div className="home-bento__item" id="home-bento__item-02">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <h3 className="home-bento__item-title">Docs on the go</h3>
                <p className="home-bento__item-subtitle">
                  Supports MD/MDX, SEO tags, code highlighting, search, dark
                  mode and more. <br />
                </p>
                <a
                  href="https://xyd.dev/docs/guides/writing-quickstart"
                  target="_blank"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
                >
                  Learn more
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame2.png" />
                  <img alt="visual" src="./frame2.png" />
                </picture>
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame2.png" />
                  <img alt="visual" src="./frame2.png" />
                </picture>
              </div>
            </div>
          </div>
          <div className="home-bento__item" id="home-bento__item-03">
            <div className="home-bento__item-inner">
              <div className="home-bento__item-text home-bento__item-text--desktop">
                <h3 className="home-bento__item-title">
                  OpenAPI, GraphQL & <br />
                  SDK generation
                </h3>
                <p className="home-bento__item-subtitle">
                  Automatic documentation generation from API specs.
                </p>
                <a
                  href="https://xyd.dev/docs/guides/openapi"
                  target="_blank"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium uppercase text-sm tracking-wider"
                >
                  Learn more
                </a>
              </div>
              <div className="home-bento__item-image-main-wrapper">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame1.png" />
                  <img alt="visual" src="./frame1.png" />
                </picture>
              </div>
              <div className="home-bento__item-image-main-wrapper-mobile">
                <picture>
                  <source media="(min-width: 768px)" srcSet="./frame1.png" />
                  <img alt="visual" src="./frame1.png" />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
