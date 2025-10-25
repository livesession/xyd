export function BentoSection() {
  return (
    <section className="relative bg-white text-gray-900 py-24 bg-cover bg-center bg-no-repeat bg-[url('/gradient1.png')]">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-6xl lg:text-7xl font-normal mb-6 text-gray-900" style={{ letterSpacing: '1px' }}>
            Build & collaborate
            <br />
            together
          </h2>
          <p className="text-gray-600 text-lg max-w-md">
            xyd is built for developers who want powerful, customizable documentation that scales with their projects.
          </p>
        </div>

        <div className="o-grid" id="home-bento__wrapper">
  {" "}
  <div className="home-bento__item" id="home-bento__item-01">
    {" "}
    <div
      className="o-rimlight"
      style={{
        "--rim-angle": "0deg",
        opacity: "0",
        visibility: "hidden",
      }}
    />{" "}
    <div className="home-bento__item-inner">
      {" "}
      <div className="home-bento__item-image-line-wrapper">
        {" "}
        <img alt="visual" src="/assets/images/card01.png" />{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento01.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile01.png" />{" "}
        </picture>{" "}
        <div id="home-bento__item-01-visual-wrapper">
          {" "}
          <div id="home-bento__item-01-visual-label">Use when</div>{" "}
          <div id="home-bento__item-01-visual-textbox">
            {" "}
            <div id="home-bento__item-01-visual-textbox-text">
              When working with API documentation
            </div>{" "}
          </div>{" "}
          <div id="home-bento__item-01-visual-button-pulse" />{" "}
          <div
            className="home-bento__item-01-visual-button"
            data-id="success"
            id="home-bento__item-01-visual-button-success">
            {" "}
            <div className="o-icon">
              {" "}
              <svg viewBox="0 0 5 5">
                {" "}
                <path d="M0.568,2.876l1.552,1.141l2.329-3.042" />{" "}
              </svg>{" "}
            </div>{" "}
            <div className="home-bento__item-01-visual-button-text">
              Approved new knowledge: When working with API documentation
            </div>{" "}
          </div>{" "}
          <div
            className="home-bento__item-01-visual-button"
            data-id="fail"
            id="home-bento__item-01-visual-button-fail">
            {" "}
            <div className="o-icon">
              {" "}
              <svg viewBox="0 0 5 5">
                {" "}
                <line x1="0.947" x2="4.053" y1="0.947" y2="4.053" />{" "}
                <line x1="4.053" x2="0.947" y1="0.947" y2="4.053" />{" "}
              </svg>{" "}
            </div>{" "}
            <div className="home-bento__item-01-visual-button-text">
              Rejected new knowledge: When working with API documentation
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="home-bento__item-text">
        {" "}
        <h3 className="home-bento__item-title">
          Customize every component & <br />
          extend your docs framework
        </h3>{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper-mobile">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento01.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile01.png" />{" "}
        </picture>{" "}
      </div>{" "}
    </div>{" "}
  </div>{" "}
  <div className="home-bento__item" id="home-bento__item-02">
    {" "}
    <div
      className="o-rimlight"
      style={{
        "--rim-angle": "0deg",
        opacity: "0",
        visibility: "hidden",
      }}
    />{" "}
    <div className="home-bento__item-inner">
      {" "}
      <div className="home-bento__item-image-line-wrapper">
        {" "}
        <img alt="visual" src="/assets/images/card02-line.png" />{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento02.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile02.png" />{" "}
        </picture>{" "}
      </div>{" "}
      <div className="home-bento__item-text">
        {" "}
        <h3 className="home-bento__item-title">Docs on the go</h3>{" "}
        <p className="home-bento__item-subtitle">
          Build beautiful documentation <br />
          with instant hot reload and zero config.
        </p>{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper-mobile">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento02.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile02.png" />{" "}
        </picture>{" "}
      </div>{" "}
    </div>{" "}
  </div>{" "}
  <div className="home-bento__item" id="home-bento__item-03">
    {" "}
    <div
      className="o-rimlight"
      style={{
        "--rim-angle": "0deg",
        opacity: "0",
        visibility: "hidden",
      }}
    />{" "}
    <div className="home-bento__item-inner">
      {" "}
      <div className="home-bento__item-image-line-wrapper">
        {" "}
        <img alt="visual" src="/assets/images/card03-line.png" />{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento03.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile03.png" />{" "}
        </picture>{" "}
        <img
          alt="visual"
          id="home-bento__item-03-hover"
          src="/assets/images/bento-hover03.png"
        />{" "}
        <div id="home-bento__item-image-main-wrapper-dot">
          {" "}
          <div className="home-bento__item-image-dot-pulse" />{" "}
          <div className="o-icon">
            {" "}
            <svg viewBox="0 0 16 16">
              {" "}
              <circle className="st0" cx="2.834" cy="8" r="0.933" />{" "}
              <circle className="st0" cx="8.034" cy="8" r="0.933" />{" "}
              <circle className="st0" cx="13.233" cy="8" r="0.933" />{" "}
            </svg>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="home-bento__item-text">
        {" "}
        <span className="home-bento__item-label">Integrate</span>{" "}
        <h3 className="home-bento__item-title">
          OpenAPI, GraphQL & <br />
          SDK generation
        </h3>{" "}
        <p className="home-bento__item-subtitle">
          Automatic documentation generation from API specs, <br />
          with built-in SDK generation capabilities.
        </p>{" "}
      </div>{" "}
      <div className="home-bento__item-image-main-wrapper-mobile">
        {" "}
        <picture>
          {" "}
          <source
            media="(min-width: 768px)"
            srcSet="/assets/images/bento03.png"
          />{" "}
          <img alt="visual" src="/assets/images/bento-mobile03.png" />{" "}
        </picture>{" "}
      </div>{" "}
    </div>{" "}
  </div>{" "}
</div>
        
      </div>
    </section>
  );
}

