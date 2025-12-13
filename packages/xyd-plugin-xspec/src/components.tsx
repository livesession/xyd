import type { PluginComponents } from "@xyd-js/plugins";

import XSpecPre from "./components/XSpecPre";
import XSpec from "./components/XSpec";
import XSpecWrapper from "./components/XSpecWrapper";
import Section from "./components/XSpecSection";

export const components: PluginComponents = {
  XSpec,

  h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
  h5: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
  h6: ({ children, ...props }) => <h6 {...props}>{children}</h6>,

  p: ({ children, ...props }) => <p {...props}>{children}</p>,

  a: ({ children, ...props }) => <a {...props}>{children}</a>,

  dt: ({ children, ...props }) => (
    <dfn>
      <dt {...props}>
        <dfn>{children}</dfn>
      </dt>
    </dfn>
  ),
  dl: ({ children, ...props }) => <dl {...props}>{children}</dl>,
  dd: ({ children, ...props }) => <dd {...props}>{children}</dd>,
  dfn: ({ children, ...props }) => <dfn {...props}>{children}</dfn>,

  img: ({ children, ...props }) => <img {...props} />,

  ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li {...props}>{children}</li>,

  header: ({ children, ...props }) => <header {...props}>{children}</header>,
  section: XSpec.Section,
  Section,
  article: ({ children, ...props }) => <article {...props}>{children}</article>,
  footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,

  table: ({ children, ...props }) => <table {...props}>{children}</table>,

  pre: XSpecPre,
  code: ({ children, ...props }) => <code {...props}>{children}</code>,
  wrapper: XSpecWrapper,
  Callout: XSpec.Box,
} as const;
