import React, { useState, useEffect } from "react";
import { useRemarkSync } from 'react-remark';

import { UXAnalytics } from "openux-js";
import {UXNode} from "openux-js";

import { AskAI, useAskAI } from "@xyd-js/ask-ai/react";
import { ReactContent, stdContent, ContentDecorator } from '@xyd-js/components/content';
import {
  Steps
} from "@xyd-js/components/writer"
import {
  Code as XydCode,
  annotations
} from '@xyd-js/components/coder';
import {CodeSample} from '@xyd-js/components/coder';

import { preload } from '@code-hike/lighter';

import { highlight } from './highlight';
import { theme } from './defaultTheme';

import "./index.css";

// import "@xyd-js/components/index.css"
// import "@xyd-js/themes/reset.css"
import "@xyd-js/themes/index.css"


const reactContent = new ReactContent({}, {
  Link: () => null,
  components: {},
  useLocation: () => ({ search: "" }),
  useNavigate: () => {},
  useNavigation: () => {},
  // Link?: React.ElementType
  // components?: { [component: string]: (props: any) => React.JSX.Element | null }
  // useLocation?: () => {
  //     search: string
  // } // TODO: !!!! BETTER API !!!!!
  // useNavigate?: (to: any) => void // TODO: !!!! BETTER API !!!!!
  // useNavigation?: () => any, // TODO: !!!! BETTER API !!!!!
})
const {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,

  p: P,

  table: Table,
  tr: Tr,
  td: Td,
  th: Th,

  code: Code,

  details: Details,
  blockquote: Blockquote,

  hr: Hr,
  a: A
} = stdContent.bind(reactContent)();

const mockAnalytics = {
  track() {
    console.log("track")
  }
}

const CONTENT = `
Here’s a list of the available endpoints:

### Alerts
1. **List Alerts**: Get a list of all alerts.
2. **Create Alert**: Create a new alert.
3. **Update Alert by ID**: Update an existing alert.
4. **Delete Alert by ID**: Delete an alert by its ID.

### Webhooks
1. **List Webhooks**: Get a list of all webhooks.
2. **Create Webhook**: Create a new webhook.
3. **Update Webhook**: Update an existing webhook.
4. **Delete Webhook**: Delete a webhook by its ID.

### Websites
1. **List Websites**: Get a list of all websites.
2. **Create Website**: Create a new website.

### Authentication
1. **Get Token Info**: Display information about the stored authentication token.

If you need details about any specific endpoint, let me know!
`
export default function App() {
  const { messages, submit, disabled, loading } = useAskAI("http://localhost:3500/ask");
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  async function loadCodeGrammars() {
    await preload(
      ['javascript', 'jsx', 'txt', 'typescript', 'tsx', 'json', 'http', 'bash'], // TODO: load grammars based od `code` ?
      theme
    );
  }
  
  useEffect(() => {
    loadCodeGrammars();
  }, []);


  const getPlaceholder = () => {
    if (loading) {
      return `Loading${'.'.repeat(dots)}`;
    }
    return "Ask a question";
  };

  return (
    <UXAnalytics analytics={mockAnalytics}>
      <main>
      <h1>AI components demo</h1>
      <AskAI 
        onSubmit={submit as any} 
        disabled={disabled} 
        placeholder={getPlaceholder()}
      >
        <ContentDecorator>
          {/* <_Message message={CONTENT} /> */}

          {messages.map((message) => (
            <AskAI.Message
              key={message.id}
              type={message.type}
            >
              <_Message message={message.content} />
            </AskAI.Message>
          ))}
          </ContentDecorator>
      </AskAI>
    </main>
    </UXAnalytics>
  );
}


function _Message({ message }: { message: string }) {
  const components = {
      // h1: H1,
      // h2: H2,
      // h3: H3,
      // h4: H4,
      // h5: H5,
      // h6: H6,
      // //
      p: ({ ...props }) => <P {...props}>{props.children}</P>,
      // //
      table: ({ ...props }) => <Table {...props}>{props.children}</Table>,
      tr: ({ ...props }) => <Tr {...props}>{props.children}</Tr>,
      td: ({ ...props }) => <Td {...props}>{props.children}</Td>,
      th: ({ ...props }) => <Th {...props}>{props.children}</Th>,
      // //
      code: ({ ...props }) => <Code {...props}>{props.children}</Code>,
      pre: ({ ...props }) => <Pre {...props}>{props.children}</Pre>,

      ol: ({ ...props }) => <Steps {...props}>{props.children}</Steps>,
      ul: ({ ...props }) => <Steps {...props}>{props.children}</Steps>,
      // li: ({ ...props }) => <Steps.Item {...props}>{props.children}</Steps.Item>,
      li(props) {
        const children = React.Children.map(props.children, (child) => {
          console.log(child, typeof child === components.code)
          if (typeof child === components.code) {
            return <P>{child}</P>
          }

          return child
        })

        return <Steps.Item {...props}>{children}</Steps.Item>
      },
    }

  return useRemarkSync(message, {
    remarkPlugins: [],
    rehypeReactOptions: {
      components
    }
  });
}

function Pre({ children }: { children: React.ReactNode }) {
  if (!Array.isArray(children)) {
    return null;
  }

  const codeElement = children[0];
  const { className, children: codeChildren } = codeElement.props;
  const language = className?.replace('language-', '') || '';
  const codeContent = codeChildren[0] || '';

  const highlighted = highlight(
    {
      meta: language,
      lang: language,
      value: codeContent
    },
    theme,
    language
  );

  return <CodeSample
      // theme={this.settings?.theme?.coder?.syntaxHighlight || undefined}
      theme={theme}
      name={language}
      // description={"TEST"}
      codeblocks={[
          {
              value: codeContent,
              lang: language,
              // meta: language,
              highlighted,
          }
      ]}
      lineNumbers={false}
      // size={props?.size}
      // descriptionHead={props?.descriptionHead}
      // descriptionContent={descriptionContent}
      // descriptionIcon={props?.descriptionIcon}
    />

  // return  <XydCode.Pre
  //   codeblock={highlighted}
  //   handlers={[
  //     annotations.mark,
  //     annotations.bg,
  //     annotations.lineNumbers
  //   ]}
  // />
}