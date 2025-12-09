export function Welcome() {
  return (
    <>
      <Article />
      <Sidebar />
    </>
  );
}

function Article() {
  return (
    <article data-source-base="https://github.com/leebyron/spec-md/blame/main/">
      <header>
        <h1>Spec Markdown</h1>
        <section id="intro">
          <p data-source="README.md#L3-L6">
            Renders Markdown with some additions into an HTML format commonly
            used for writing technical specification documents. Markdown
            additions include code syntax highlighting, edit annotations, and
            the definition of algorithms and grammar productions.
          </p>
          <section id="sec-Philosophy" className="subsec">
            <h6 data-source="README.md#L8">
              <a href="#sec-Philosophy" title="link to this subsection">
                Philosophy
              </a>
            </h6>
            <p data-source="README.md#L10-L11">
              Spec Markdown is first and foremost Markdown. As such, it follows
              Markdown’s philosophy of intending to be as easy to read and easy
              to write as is feasible.
            </p>
            <p data-source="README.md#L13-L16">
              In order to interoperate with other tools which use Markdown, Spec
              Markdown tries to add as little additional syntax as possible,
              instead preferring conventions. This means any documents written
              with Spec Markdown in mind should render adequately by other
              Markdown renderers.
            </p>
            <p data-source="README.md#L18-L20">
              To support the rendering additions of Spec Markdown, some features
              of Markdown may be limited or removed. As an example, Spec
              Markdown is strict about the order and locations of headers in a
              document.
            </p>
            <div
              id="note-c32a7"
              className="spec-note"
              data-source="README.md#L22-L23"
            >
              <a href="#note-c32a7">Note</a>
              This is not a normative spec for Spec Markdown, but just
              documentation of this tool. Of course, written in Spec Markdown!
            </div>
          </section>
        </section>
        <nav className="spec-toc">
          <div className="title">Contents</div>
          <ol>
            <li>
              <a href="#sec-Getting-Started">
                <span className="spec-secid">1</span>Getting Started
              </a>
            </li>
            <li>
              <a href="#sec-Markdown">
                <span className="spec-secid">2</span>Markdown
              </a>
              <ol>
                <li>
                  <a href="#sec-Character-Encoding">
                    <span className="spec-secid">2.1</span>Character Encoding
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Escape-sequence">
                        <span className="spec-secid">2.1.1</span>Escape sequence
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Inline-formatting">
                    <span className="spec-secid">2.2</span>Inline formatting
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Inline-HTML">
                        <span className="spec-secid">2.2.1</span>Inline HTML
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Links">
                        <span className="spec-secid">2.2.2</span>Links
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Emphasis">
                        <span className="spec-secid">2.2.3</span>Emphasis
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Inline-Code">
                        <span className="spec-secid">2.2.4</span>Inline Code
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Images">
                        <span className="spec-secid">2.2.5</span>Images
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Blocks">
                    <span className="spec-secid">2.3</span>Blocks
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Block-HTML">
                        <span className="spec-secid">2.3.1</span>Block HTML
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Blocks.Section-Headers">
                        <span className="spec-secid">2.3.2</span>Section Headers
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Paragraphs">
                        <span className="spec-secid">2.3.3</span>Paragraphs
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Lists">
                        <span className="spec-secid">2.3.4</span>Lists
                      </a>
                      <ol>
                        <li>
                          <a href="#sec-Task-Lists">
                            <span className="spec-secid">2.3.4.1</span>Task
                            Lists
                          </a>
                        </li>
                      </ol>
                    </li>
                    <li>
                      <a href="#sec-Code-Block">
                        <span className="spec-secid">2.3.5</span>Code Block
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Block-Quotes">
                        <span className="spec-secid">2.3.6</span>Block Quotes
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Horizontal-Rules">
                        <span className="spec-secid">2.3.7</span>Horizontal
                        Rules
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Automatic-Links">
                        <span className="spec-secid">2.3.8</span>Automatic Links
                      </a>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
            <li>
              <a href="#sec-Spec-Additions">
                <span className="spec-secid">3</span>Spec Additions
              </a>
              <ol>
                <li>
                  <a href="#sec-Link-Anything">
                    <span className="spec-secid">3.1</span>Link Anything
                  </a>
                </li>
                <li>
                  <a href="#sec-Title-and-Introduction">
                    <span className="spec-secid">3.2</span>Title and
                    Introduction
                  </a>
                </li>
                <li>
                  <a href="#sec-Sections">
                    <span className="spec-secid">3.3</span>Sections
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Sections.Section-Headers">
                        <span className="spec-secid">3.3.1</span>Section Headers
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Subsection-Headers">
                        <span className="spec-secid">3.3.2</span>Subsection
                        Headers
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Table-of-Contents">
                        <span className="spec-secid">3.3.3</span>Table of
                        Contents
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Section-Numbers">
                        <span className="spec-secid">3.3.4</span>Section Numbers
                      </a>
                      <ol>
                        <li>
                          <a href="#sec-Custom-Numbers">
                            <span className="spec-secid">3.3.4.8</span>Custom
                            Numbers
                          </a>
                        </li>
                        <li>
                          <a href="#sec-Appendix-Annex-Sections">
                            <span className="spec-secid">3.3.4.9</span>Appendix
                            / Annex Sections
                          </a>
                        </li>
                      </ol>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Smart-Characters">
                    <span className="spec-secid">3.4</span>Smart Characters
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Quotes-and-Dashes">
                        <span className="spec-secid">3.4.1</span>Quotes and
                        Dashes
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Math">
                        <span className="spec-secid">3.4.2</span>Math
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Arrows">
                        <span className="spec-secid">3.4.3</span>Arrows
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Tables">
                    <span className="spec-secid">3.5</span>Tables
                  </a>
                </li>
                <li>
                  <a href="#sec-Comments">
                    <span className="spec-secid">3.6</span>Comments
                  </a>
                </li>
                <li>
                  <a href="#sec-Definitions">
                    <span className="spec-secid">3.7</span>Definitions
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Definition-List">
                        <span className="spec-secid">3.7.1</span>Definition List
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Definition-Paragraph">
                        <span className="spec-secid">3.7.2</span>Definition
                        Paragraph
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Definition-References">
                        <span className="spec-secid">3.7.3</span>Definition
                        References
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Note">
                    <span className="spec-secid">3.8</span>Note
                  </a>
                </li>
                <li>
                  <a href="#sec-Todo">
                    <span className="spec-secid">3.9</span>Todo
                  </a>
                </li>
                <li>
                  <a href="#sec-Syntax-Highlighting">
                    <span className="spec-secid">3.10</span>Syntax Highlighting
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Examples">
                        <span className="spec-secid">3.10.1</span>Examples
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Counter-Examples">
                        <span className="spec-secid">3.10.2</span>Counter
                        Examples
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Imports">
                    <span className="spec-secid">3.11</span>Imports
                  </a>
                </li>
                <li>
                  <a href="#sec-Inline-editing">
                    <span className="spec-secid">3.12</span>Inline editing
                  </a>
                </li>
                <li>
                  <a href="#sec-Block-editing">
                    <span className="spec-secid">3.13</span>Block editing
                  </a>
                </li>
                <li>
                  <a href="#sec-Algorithms">
                    <span className="spec-secid">3.14</span>Algorithms
                  </a>
                </li>
                <li>
                  <a href="#sec-Grammar">
                    <span className="spec-secid">3.15</span>Grammar
                  </a>
                  <ol>
                    <li>
                      <a href="#sec-Grammar-Production">
                        <span className="spec-secid">3.15.1</span>Grammar
                        Production
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Production-types">
                        <span className="spec-secid">3.15.2</span>Production
                        types
                      </a>
                    </li>
                    <li>
                      <a href="#sec-One-of">
                        <span className="spec-secid">3.15.3</span>One of
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Non-Terminal-Token">
                        <span className="spec-secid">3.15.4</span>Non Terminal
                        Token
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Prose">
                        <span className="spec-secid">3.15.5</span>Prose
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Terminal-Token">
                        <span className="spec-secid">3.15.6</span>Terminal Token
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Regular-Expression">
                        <span className="spec-secid">3.15.7</span>Regular
                        Expression
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Quantifiers">
                        <span className="spec-secid">3.15.8</span>Quantifiers
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Conditional-Parameters">
                        <span className="spec-secid">3.15.9</span>Conditional
                        Parameters
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Constraints">
                        <span className="spec-secid">3.15.10</span>Constraints
                      </a>
                    </li>
                    <li>
                      <a href="#sec-Meta-Tokens">
                        <span className="spec-secid">3.15.11</span>Meta Tokens
                      </a>
                    </li>
                  </ol>
                </li>
                <li>
                  <a href="#sec-Grammar-Semantics">
                    <span className="spec-secid">3.16</span>Grammar Semantics
                  </a>
                </li>
                <li>
                  <a href="#sec-Value-Literals">
                    <span className="spec-secid">3.17</span>Value Literals
                  </a>
                </li>
                <li>
                  <a href="#sec-Biblio">
                    <span className="spec-secid">3.18</span>Biblio
                  </a>
                </li>
              </ol>
            </li>
            <li>
              <a href="#sec-Using-Spec-Markdown">
                <span className="spec-secid">A</span>Using Spec Markdown
              </a>
              <ol>
                <li>
                  <a href="#sec-Print-Options">
                    <span className="spec-secid">A.1</span>Print Options
                  </a>
                </li>
                <li>
                  <a href="#sec-Hot-rebuilding-with-nodemon">
                    <span className="spec-secid">A.2</span>Hot rebuilding with
                    nodemon
                  </a>
                </li>
              </ol>
            </li>
            <li>
              <a href="#sec-Contributing-to-Spec-Markdown">
                <span className="spec-secid">B</span>Contributing to Spec
                Markdown
              </a>
              <ol>
                <li>
                  <a href="#sec-Pull-Requests">
                    <span className="spec-secid">B.1</span>Pull Requests
                  </a>
                </li>
                <li>
                  <a href="#sec--main-is-unsafe">
                    <span className="spec-secid">B.2</span>`main` is unsafe
                  </a>
                </li>
                <li>
                  <a href="#sec-Issues">
                    <span className="spec-secid">B.3</span>Issues
                  </a>
                </li>
                <li>
                  <a href="#sec-Coding-Style">
                    <span className="spec-secid">B.4</span>Coding Style
                  </a>
                </li>
                <li>
                  <a href="#sec-License">
                    <span className="spec-secid">B.5</span>License
                  </a>
                </li>
              </ol>
            </li>
            <li>
              <a href="#index">
                <span className="spec-secid">§</span>Index
              </a>
            </li>
          </ol>
        </nav>
      </header>
      <section id="sec-Getting-Started" secid={1}>
        <h1 data-source="README.md#L26">
          <span className="spec-secid" title="link to this section">
            <a href="#sec-Getting-Started">1</a>
          </span>
          Getting Started
        </h1>
        <p data-source="README.md#L28-L29">
          To use Spec Markdown, just write Markdown files. There are some
          conventions used by Spec Markdown which you can read about in{" "}
          <a href="#sec-Spec-Additions">Spec additions</a>.
        </p>
        <p data-source="README.md#L31-L32">
          To convert your Markdown files into an HTML spec document, use the{" "}
          <code>spec-md</code> utility.
        </p>
        <pre data-language="sh" data-source="README.md#L34-L37">
          <code>
            npm install -g spec-md{"\n"}spec-md ./path/to/markdown.md &gt;
            ./path/to/output.html{"\n"}
          </code>
        </pre>
        <p data-source="README.md#L39">
          You can also require <code>spec-md</code> as a node module.
        </p>
        <pre data-language="sh" data-source="README.md#L41-L43">
          <code>npm install --save-dev spec-md{"\n"}</code>
        </pre>
        <pre data-language="js" data-source="README.md#L45-L51">
          <code>
            <span className="token keyword">const</span> fs{" "}
            <span className="token operator">=</span>{" "}
            <span className="token function">require</span>
            <span className="token punctuation">(</span>
            <span className="token string">'fs'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
            <span className="token keyword">const</span> specMarkdown{" "}
            <span className="token operator">=</span>{" "}
            <span className="token function">require</span>
            <span className="token punctuation">(</span>
            <span className="token string">'spec-md'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}specMarkdown<span className="token punctuation">.</span>
            <span className="token method function property-access">html</span>
            <span className="token punctuation">(</span>
            <span className="token string">'./path/to/markdown.md'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">.</span>
            <span className="token method function property-access">then</span>
            <span className="token punctuation">(</span>
            <span className="token parameter">html</span>{" "}
            <span className="token arrow operator">=&gt;</span>{" "}
            <span className="token punctuation">{"{"}</span>
            {"\n"}
            {"  "}fs<span className="token punctuation">.</span>
            <span className="token method function property-access">
              writeFile
            </span>
            <span className="token punctuation">(</span>
            <span className="token string">'./path/to/output.html'</span>
            <span className="token punctuation">,</span> html
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
            <span className="token punctuation">{"}"}</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
          </code>
        </pre>
        <p data-source="README.md#L53-L55">
          Spec Markdown also provides utilities for generating and operating on
          an intermediate representation of the markdown, which you can explore
          in <a href="#sec-Using-Spec-Markdown">Using Spec Markdown</a>.
        </p>
      </section>
      <section id="sec-Markdown" secid={2}>
        <h1 data-source="spec/Markdown.md#L1">
          <span className="spec-secid" title="link to this section">
            <a href="#sec-Markdown">2</a>
          </span>
          Markdown
        </h1>
        <p data-source="spec/Markdown.md#L3-L4">
          Spec Markdown is first and foremost{" "}
          <a href="http://daringfireball.net/projects/markdown/syntax">
            Markdown
          </a>
          . More specifically, it’s based on{" "}
          <a href="https://help.github.com/articles/github-flavored-markdown/">
            Github-flavored Markdown
          </a>
          .
        </p>
        <p data-source="spec/Markdown.md#L6-L7">
          This section explains the syntax and capabilities of Markdown that
          Spec Markdown supports and augments.
        </p>
        <section id="sec-Character-Encoding" secid="2.1">
          <h2 data-source="spec/Markdown.md#L10">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Character-Encoding">2.1</a>
            </span>
            Character Encoding
          </h2>
          <p data-source="spec/Markdown.md#L12-L13">
            Markdown allows you to write text which uses &amp;, &lt;, and &gt;.
            The output HTML will automatically use the <code>&amp;amp;</code>,{" "}
            <code>&amp;lt;</code>, and <code>&amp;gt;</code> entities.
          </p>
          <p data-source="spec/Markdown.md#L15-L16">
            Well formed HTML entities can be written inline directly. If you
            write <code>&amp;copy;</code>, it will appear in the HTML output as
            ©.
          </p>
          <section id="sec-Escape-sequence" secid="2.1.1">
            <h3 data-source="spec/Markdown.md#L19">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Escape-sequence">2.1.1</a>
              </span>
              Escape sequence
            </h3>
            <p data-source="spec/Markdown.md#L21-L22">
              Markdown makes use of certain characters to format text, in order
              to render one explicitly, place a backslash before it.
            </p>
            <p data-source="spec/Markdown.md#L24-L25">
              You can type *literal asterisks* instead of emphasis by typing{" "}
              <code>\*literal asterisks\*</code>.
            </p>
            <p data-source="spec/Markdown.md#L27">
              Escaping does not apply within code.
            </p>
            <p data-source="spec/Markdown.md#L29">
              Spec Markdown allows backslash escapes for any ASCII punctuation
              character.
            </p>
            <pre data-source="spec/Markdown.md#L31-L33">
              <code>
                \!\"\#\$\%\&amp;\'\(\)\*\+\,\-\.\/\:\;\&lt;\=\&gt;\?\@\[\\\]\^\_\`\
                {"{"}\|\{"}"}\~{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L35">Produces the following:</p>
            <p data-source="spec/Markdown.md#L37">
              !"#$%&amp;'()*+,-./:;&lt;=&gt;?@[\]^_`{"{"}|{"}"}~
            </p>
          </section>
        </section>
        <section id="sec-Inline-formatting" secid="2.2">
          <h2 data-source="spec/Markdown.md#L39">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Inline-formatting">2.2</a>
            </span>
            Inline formatting
          </h2>
          <p data-source="spec/Markdown.md#L41-L42">
            Markdown allows for inline stylistic and structual formatting.
            Inline formatting is allowed in paragraphs, list items, and table
            cells.
          </p>
          <section id="sec-Inline-HTML" secid="2.2.1">
            <h3 data-source="spec/Markdown.md#L45">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Inline-HTML">2.2.1</a>
              </span>
              Inline HTML
            </h3>
            <p data-source="spec/Markdown.md#L47-L48">
              Markdown is not a replacement for HTML and instead leverages HTML
              by allowing its use inline within paragraphs, links, etc.
            </p>
            <p data-source="spec/Markdown.md#L50">
              This code has <blink>blinking</blink> and <em>emphasized</em>{" "}
              formatting.
            </p>
            <p data-source="spec/Markdown.md#L52">
              Markdown syntax can continue to be{" "}
              <u>
                used <em>within</em> inline HTML
              </u>
              .
            </p>
          </section>
          <section id="sec-Links" secid="2.2.2">
            <h3 data-source="spec/Markdown.md#L55">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Links">2.2.2</a>
              </span>
              Links
            </h3>
            <p data-source="spec/Markdown.md#L57-L58">
              Use <code>[ ]</code> square brackets to indicate linked text
              followed immediately by <code>( )</code> parenthesis to describe
              the URL the text will link to.
            </p>
            <p data-source="spec/Markdown.md#L60">
              The linked text can contain any other inline formatting.
            </p>
            <pre data-source="spec/Markdown.md#L62-L64">
              <code>
                This is an [--&gt;*example*&lt;--](https://www.facebook.com) of
                a link.{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L66">Produces the following:</p>
            <p data-source="spec/Markdown.md#L68">
              This is an{" "}
              <a href="https://www.facebook.com">
                →<em>example</em>←
              </a>{" "}
              of a link.
            </p>
            <div className="spec-todo" data-source="spec/Markdown.md#L71">
              Links do not yet support a reference style short-form.
            </div>
          </section>
          <section id="sec-Emphasis" secid="2.2.3">
            <h3 data-source="spec/Markdown.md#L74">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Emphasis">2.2.3</a>
              </span>
              Emphasis
            </h3>
            <p data-source="spec/Markdown.md#L76">
              Wrapping asterisks <em>(*)</em> indicate emphasis.
            </p>
            <pre data-source="spec/Markdown.md#L78-L80">
              <code>
                Example of **bold** and *italic* and ***bold italic***.{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L82">Produces the following:</p>
            <p data-source="spec/Markdown.md#L84">
              Example of <strong>bold</strong> and <em>italic</em> and{" "}
              <strong>
                <em>bold italic</em>
              </strong>
              .
            </p>
            <p data-source="spec/Markdown.md#L86">
              Alternatively, use underscore <em>(_)</em> for italic emphasis.
            </p>
            <pre data-source="spec/Markdown.md#L88-L90">
              <code>
                Example of _italic_ and **_bold italic_** or _**bold italic**_.
                {"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L92">Produces the following:</p>
            <p data-source="spec/Markdown.md#L94">
              Example of <em>italic</em> and{" "}
              <strong>
                <em>bold italic</em>
              </strong>{" "}
              or{" "}
              <em>
                <strong>bold italic</strong>
              </em>
              .
            </p>
          </section>
          <section id="sec-Inline-Code" secid="2.2.4">
            <h3 data-source="spec/Markdown.md#L97">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Inline-Code">2.2.4</a>
              </span>
              Inline Code
            </h3>
            <p data-source="spec/Markdown.md#L99-L101">
              Wrapping back-ticks <em>(`)</em> indicate inline code, text inside
              back-ticks is not formatted, allowing for special characters to be
              used in inline code without escapes.
            </p>
            <pre data-source="spec/Markdown.md#L103-L105">
              <code>This is an `example` of some inline code.{"\n"}</code>
            </pre>
            <p data-source="spec/Markdown.md#L107">Produces</p>
            <p data-source="spec/Markdown.md#L109">
              This is an <code>example</code> of some inline code.
            </p>
            <p data-source="spec/Markdown.md#L112">
              Inline code can also use double- or triple-backticks. Wrapping
              spaces are removed.
            </p>
            <p data-source="spec/Markdown.md#L114">
              <code>`` ` ``</code> Produces <code>`</code>
            </p>
          </section>
          <section id="sec-Images" secid="2.2.5">
            <h3 data-source="spec/Markdown.md#L117">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Images">2.2.5</a>
              </span>
              Images
            </h3>
            <pre data-source="spec/Markdown.md#L119-L121">
              <code>![Specs](http://i.imgur.com/aV8o3rE.png){"\n"}</code>
            </pre>
            <p data-source="spec/Markdown.md#L123">Produces the following:</p>
            <p data-source="spec/Markdown.md#L125">
              <img src="http://i.imgur.com/aV8o3rE.png" alt="Specs" />
            </p>
          </section>
        </section>
        <section id="sec-Blocks" secid="2.3">
          <h2 data-source="spec/Markdown.md#L128">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Blocks">2.3</a>
            </span>
            Blocks
          </h2>
          <p data-source="spec/Markdown.md#L130-L132">
            Markdown allows for block-level structual formatting. Every block is
            seperated by at least two new lines. Spec Markdown makes use of
            Markdown’s blocks to produce more specific structural formatting.
          </p>
          <section id="sec-Block-HTML" secid="2.3.1">
            <h3 data-source="spec/Markdown.md#L135">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Block-HTML">2.3.1</a>
              </span>
              Block HTML
            </h3>
            <p data-source="spec/Markdown.md#L137-L139">
              Markdown is not a replacement for HTML and instead leverages HTML
              by allowing its use as complete blocks when separated from
              surrounding content by blank lines.
            </p>
            <div
              id="note-5b9d8"
              className="spec-note"
              data-source="spec/Markdown.md#L141"
            >
              <a href="#note-5b9d8">Note</a>
              Markdown formatting syntax is not processed within block-level
              HTML tags.
            </div>
            <p data-source="spec/Markdown.md#L143">
              For example, to add an HTML table to a Markdown article:
            </p>
            <pre data-source="spec/Markdown.md#L145-L162">
              <code>
                Unrelated previous paragraph followed by a blank line{"\n"}
                {"\n"}&lt;table&gt;{"\n"}&lt;tr&gt;{"\n"}&lt;td&gt;Table
                cell&lt;/td&gt;{"\n"}&lt;td&gt;{"\n"}
                {"\n"}&lt;table&gt;{"\n"}&lt;tr&gt;{"\n"}&lt;td&gt;*Tables in
                tables*&lt;/td&gt;{"\n"}&lt;/tr&gt;{"\n"}&lt;/table&gt;{"\n"}
                {"\n"}&lt;/td&gt;{"\n"}&lt;/tr&gt;{"\n"}&lt;/table&gt;{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L164">Produces the following:</p>
            <p data-source="spec/Markdown.md#L166">
              Unrelated previous paragraph followed by a blank line
            </p>
            <table>
              <tbody>
                <tr>
                  <td>Table cell</td>
                  <td>
                    <table>
                      <tbody>
                        <tr>
                          <td>*Tables in tables*</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <p data-source="spec/Markdown.md#L183">
              And using <code>&lt;pre&gt;</code> produces a simple code block:
            </p>
            <pre data-source="spec/Markdown.md#L185-L199">
              <code>
                &lt;pre&gt;{"\n"}Buffalo Bill ’s{"\n"}defunct{"\n"}
                {"       "}who used to{"\n"}
                {"       "}ride a watersmooth-silver{"\n"}
                {"                                "}stallion{"\n"}and break
                onetwothreefourfive pigeonsjustlikethat{"\n"}
                {"                                                 "}Jesus{"\n"}
                he was a handsome man{"\n"}
                {"                     "}and what i want to know is{"\n"}how do
                you like your blueeyed boy{"\n"}Mister Death{"\n"}&lt;/pre&gt;
                {"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L201">Produces the following:</p>
            <pre>
              Buffalo Bill ’s{"\n"}defunct{"\n"}
              {"       "}who used to{"\n"}
              {"       "}ride a watersmooth-silver{"\n"}
              {"                                "}stallion{"\n"}and break
              onetwothreefourfive pigeonsjustlikethat{"\n"}
              {"                                                 "}Jesus{"\n"}he
              was a handsome man{"\n"}
              {"                     "}and what i want to know is{"\n"}how do
              you like your blueeyed boy{"\n"}Mister Death{"\n"}
            </pre>
          </section>
          <section id="sec-Blocks.Section-Headers" secid="2.3.2">
            <h3 data-source="spec/Markdown.md#L218">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Blocks.Section-Headers">2.3.2</a>
              </span>
              Section Headers
            </h3>
            <p data-source="spec/Markdown.md#L220-L221">
              Regular Markdown supports two styles of headers, Setext and atx,
              however Spec Markdown generally only supports atx style headers.
            </p>
            <pre
              id="example-d82de"
              className="spec-example"
              data-source="spec/Markdown.md#L223-L225"
            >
              <a href="#example-d82de">Example № 1</a>
              <code># Header{"\n"}</code>
            </pre>
            <p data-source="spec/Markdown.md#L227">
              Setext headers are not supported by Spec Markdown.
            </p>
            <pre
              id="example-7c917"
              className="spec-counter-example"
              data-source="spec/Markdown.md#L229-L232"
            >
              <a href="#example-7c917">Counter Example № 2</a>
              <code>
                Header{"\n"}------{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L234-L236">
              The number of <code>#</code> characters refers to the depth of the
              section. To produce an, <code>&lt;h3&gt;</code>, type{" "}
              <code>###</code>. Optionally, a header may be “closed” by any
              number of <code>#</code> characters.
            </p>
            <div
              id="note-e6510"
              className="spec-note"
              data-source="spec/Markdown.md#L238"
            >
              <a href="#note-e6510">Note</a>
              Spec Markdown requires that documents start with a header.
            </div>
          </section>
          <section id="sec-Paragraphs" secid="2.3.3">
            <h3 data-source="spec/Markdown.md#L241">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Paragraphs">2.3.3</a>
              </span>
              Paragraphs
            </h3>
            <p data-source="spec/Markdown.md#L243-L244">
              Paragraphs are the most simple Markdown blocks. Lines are appended
              together to form a single &lt;p&gt; tag. Any inline syntax is
              allowed within a paragraph.
            </p>
          </section>
          <section id="sec-Lists" secid="2.3.4">
            <h3 data-source="spec/Markdown.md#L247">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Lists">2.3.4</a>
              </span>
              Lists
            </h3>
            <p data-source="spec/Markdown.md#L249-L250">
              Markdown lists are lines which each start with either a ordered
              bullet <code>1.</code> or unordered bullet, <code>*</code>,{" "}
              <code>-</code>, or <code>+</code>. Lists are optionally indented
              by two spaces.
            </p>
            <p data-source="spec/Markdown.md#L252">
              Lists can be nested within other lists by indenting by at least
              two spaces.
            </p>
            <pre
              id="example-4d8ec"
              className="spec-example"
              data-source="spec/Markdown.md#L254-L260"
            >
              <a href="#example-4d8ec">Example № 3</a>
              <code>
                {"  "}1. this{"\n"}
                {"  "}2. is{"\n"}
                {"  "}3. a{"\n"}
                {"    "}- nested{"\n"}
                {"  "}4. list{"\n"}
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L262">Produces the following:</p>
            <ol>
              <li data-source="spec/Markdown.md#L264">this</li>
              <li data-source="spec/Markdown.md#L265">is</li>
              <li data-source="spec/Markdown.md#L266-L267">
                a
                <ul>
                  <li data-source="spec/Markdown.md#L267">nested</li>
                </ul>
              </li>
              <li data-source="spec/Markdown.md#L268">list</li>
            </ol>
            <section id="sec-Task-Lists" secid="2.3.4.1">
              <h4 data-source="spec/Markdown.md#L270">
                <span className="spec-secid" title="link to this section">
                  <a href="#sec-Task-Lists">2.3.4.1</a>
                </span>
                Task Lists
              </h4>
              <p data-source="spec/Markdown.md#L272-L274">
                Spec Markdown also supports task lists. Start a list item with{" "}
                <code>[ ]</code> or <code>[x]</code> to render a checkbox. This
                can be useful for keeping your tasks inline with in-progress
                draft specifications.
              </p>
              <pre
                id="example-f34a9"
                className="spec-example"
                data-source="spec/Markdown.md#L276-L282"
              >
                <a href="#example-f34a9">Example № 4</a>
                <code>
                  {"  "}1. this{"\n"}
                  {"  "}2. [ ] is{"\n"}
                  {"  "}3. [x] a{"\n"}
                  {"    "}- [X] nested{"\n"}
                  {"  "}4. todo list{"\n"}
                </code>
              </pre>
              <p data-source="spec/Markdown.md#L284">Produces the following:</p>
              <ol>
                <li data-source="spec/Markdown.md#L286">this</li>
                <li className="task" data-source="spec/Markdown.md#L287">
                  <input type="checkbox" disabled="" />
                  is
                </li>
                <li className="task" data-source="spec/Markdown.md#L288-L289">
                  <input type="checkbox" disabled="" defaultChecked="" />a
                  <ul>
                    <li className="task" data-source="spec/Markdown.md#L289">
                      <input type="checkbox" disabled="" defaultChecked="" />
                      nested
                    </li>
                  </ul>
                </li>
                <li data-source="spec/Markdown.md#L290">todo list</li>
              </ol>
            </section>
          </section>
          <section id="sec-Code-Block" secid="2.3.5">
            <h3 data-source="spec/Markdown.md#L293">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Code-Block">2.3.5</a>
              </span>
              Code Block
            </h3>
            <p data-source="spec/Markdown.md#L295-L296">
              A block of code is formed by either indenting by 4 spaces, or
              wrapping with <code>```</code> on their own lines.
            </p>
            <pre data-source="spec/Markdown.md#L298-L300">
              <code>
                ```{"\n"}const code = sample();{"\n"}```
              </code>
            </pre>
            <p data-source="spec/Markdown.md#L302">Produces the following:</p>
            <pre data-source="spec/Markdown.md#L304-L306">
              <code>const code = sample();{"\n"}</code>
            </pre>
          </section>
          <section id="sec-Block-Quotes" secid="2.3.6">
            <h3 data-source="spec/Markdown.md#L309">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Block-Quotes">2.3.6</a>
              </span>
              Block Quotes
            </h3>
            <p data-source="spec/Markdown.md#L311">
              Spec markdown does not yet support Markdown’s <code>&gt;</code>{" "}
              style block quotes.
            </p>
          </section>
          <section id="sec-Horizontal-Rules" secid="2.3.7">
            <h3 data-source="spec/Markdown.md#L314">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Horizontal-Rules">2.3.7</a>
              </span>
              Horizontal Rules
            </h3>
            <p data-source="spec/Markdown.md#L316">
              Spec Markdown does not yet support Markdown’s <code>---</code>{" "}
              style &lt;hr&gt;.
            </p>
          </section>
          <section id="sec-Automatic-Links" secid="2.3.8">
            <h3 data-source="spec/Markdown.md#L319">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Automatic-Links">2.3.8</a>
              </span>
              Automatic Links
            </h3>
            <p data-source="spec/Markdown.md#L321-L322">
              Spec Markdown does not yet automatically link urls.{" "}
            </p>
          </section>
        </section>
      </section>
      <section id="sec-Spec-Additions" secid={3}>
        <h1 data-source="spec/Spec%20Additions.md#L1">
          <span className="spec-secid" title="link to this section">
            <a href="#sec-Spec-Additions">3</a>
          </span>
          Spec Additions
        </h1>
        <p data-source="spec/Spec%20Additions.md#L3-L6">
          Spec Markdown makes some additions to Markdown to support cases
          relevant to writing technical specs and documentation. It attempts to
          be as minimally invasive as possible, leveraging existing Markdown
          formatting features whenever possible so Spec Markdown documents may
          render adequately as regular Markdown.
        </p>
        <p data-source="spec/Spec%20Additions.md#L8-L9">
          Spec Markdown also makes restrictions to the overall format of the
          Markdown document in order to derive a structure to the entire
          document.
        </p>
        <section id="sec-Link-Anything" secid="3.1">
          <h2 data-source="spec/Spec%20Additions.md#L12">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Link-Anything">3.1</a>
            </span>
            Link Anything
          </h2>
          <p data-source="spec/Spec%20Additions.md#L14-L18">
            Everything unique in a Spec Markdown file has a link created for it.
            Sections each have a link, as do named{" "}
            <a href="#sec-Algorithms">Algorithms</a> and{" "}
            <a href="#sec-Grammar">Grammar</a>. You’ll find that{" "}
            <a href="#sec-Note">Notes</a> and{" "}
            <a href="#sec-Examples">Examples</a> are also given stable links
            based on their contents, just in case things move around.
          </p>
          <p data-source="spec/Spec%20Additions.md#L20-L22">
            However, you can also link <em>anything</em> in a Spec Markdown
            file. Just highlight any bit of text and a link will be created just
            for that selection, making referencing specific parts of your
            document easy. Try it here!
          </p>
        </section>
        <section id="sec-Title-and-Introduction" secid="3.2">
          <h2 data-source="spec/Spec%20Additions.md#L25">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Title-and-Introduction">3.2</a>
            </span>
            Title and Introduction
          </h2>
          <p data-source="spec/Spec%20Additions.md#L27-L29">
            A Spec Markdown document must start with a header which will be used
            as the title of the document. Any content between this and the next
            header will become the introduction to the document.
          </p>
          <p data-source="spec/Spec%20Additions.md#L31">
            A Spec Markdown document starts in this form:
          </p>
          <pre data-source="spec/Spec%20Additions.md#L33-L39">
            <code>
              # Spec Markdown{"\n"}
              {"\n"}Introductory paragraph.{"\n"}
              {"\n"}# First Section Header{"\n"}
            </code>
          </pre>
          <div
            id="note-25668"
            className="spec-note"
            data-source="spec/Spec%20Additions.md#L41-L42"
          >
            <a href="#note-25668">Note</a>
            For backwards-compatibility, a setext style header can be used for a
            document title.
          </div>
        </section>
        <section id="sec-Sections" secid="3.3">
          <h2 data-source="spec/Spec%20Additions.md#L44">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Sections">3.3</a>
            </span>
            Sections
          </h2>
          <p data-source="spec/Spec%20Additions.md#L46-L50">
            A Spec Markdown document is separated into a sequence and hierarchy
            of sections. Those sections can then be used as navigation points
            and can be used to create a table of contents. A section is started
            by a header and ends at either the next header of similar or greater
            precedence or the end of the document. A section can contain other
            sections if their headers are of lower precedence.
          </p>
          <section id="sec-Sections.Section-Headers" secid="3.3.1">
            <h3 data-source="spec/Spec%20Additions.md#L53">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Sections.Section-Headers">3.3.1</a>
              </span>
              Section Headers
            </h3>
            <p data-source="spec/Spec%20Additions.md#L55-L56">
              Regular Markdown supports two styles of headers, Setext and atx,
              however Spec Markdown only supports atx style headers as section
              headers.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L58-L60">
              <code># Header{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L62">
              Only use Setext style headers for the title of the document.
            </p>
            <pre
              id="example-f87c5"
              className="spec-counter-example"
              data-source="spec/Spec%20Additions.md#L64-L67"
            >
              <a href="#example-f87c5">Counter Example № 5</a>
              <code>
                Header{"\n"}------{"\n"}
              </code>
            </pre>
          </section>
          <section id="sec-Subsection-Headers" secid="3.3.2">
            <h3 data-source="spec/Spec%20Additions.md#L70">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Subsection-Headers">3.3.2</a>
              </span>
              Subsection Headers
            </h3>
            <p data-source="spec/Spec%20Additions.md#L72-L73">
              While sections are numbered and appear in the table of contents, a
              subsection is similar but not numbered or in the table of
              contents.
            </p>
            <section
              id="sec-Subsection-Headers.This-is-a-subsection"
              className="subsec"
            >
              <h6 data-source="spec/Spec%20Additions.md#L75">
                <a
                  href="#sec-Subsection-Headers.This-is-a-subsection"
                  title="link to this subsection"
                >
                  This is a subsection
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L77">
                The subsection’s content appears below the subsection header.
              </p>
            </section>
            <section
              id="sec-Subsection-Headers.Another-subsection"
              className="subsec"
            >
              <h6 data-source="spec/Spec%20Additions.md#L79">
                <a
                  href="#sec-Subsection-Headers.Another-subsection"
                  title="link to this subsection"
                >
                  Another subsection
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L81-L82">
                Sections may contain multiple subsections, but subsections
                cannot contain sections or subsections.
              </p>
            </section>
          </section>
          <section id="sec-Table-of-Contents" secid="3.3.3">
            <h3 data-source="spec/Spec%20Additions.md#L85">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Table-of-Contents">3.3.3</a>
              </span>
              Table of Contents
            </h3>
            <p data-source="spec/Spec%20Additions.md#L87-L88">
              A table of contents is automatically generated from the hierarchy
              of sections in the Spec Markdown document.
            </p>
          </section>
          <section id="sec-Section-Numbers" secid="3.3.4">
            <h3 data-source="spec/Spec%20Additions.md#L91">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Section-Numbers">3.3.4</a>
              </span>
              Section Numbers
            </h3>
            <p data-source="spec/Spec%20Additions.md#L93-L95">
              A number is associated with each section, starting with 1. In a
              hierarchy of sections, the parent sections are joined with dots.
              This provides an unambiguous location identifier for a given
              section in a document.
            </p>
            <p data-source="spec/Spec%20Additions.md#L97-L98">
              You can specify these section numbers directly in your Markdown
              documents if you wish by writing them directly after the{" "}
              <code>#</code> and before the text of the header.
            </p>
            <section id="sec-Custom-Numbers" secid="3.3.4.8">
              <h4 data-source="spec/Spec%20Additions.md#L100">
                <span className="spec-secid" title="link to this section">
                  <a href="#sec-Custom-Numbers">3.3.4.8</a>
                </span>
                Custom Numbers
              </h4>
              <p data-source="spec/Spec%20Additions.md#L102-L104">
                If the section number is written in the document, the last
                number will be used as the number for that section. This is
                useful when writing a proposal against an existing spec and wish
                to reference a particular section.
              </p>
              <p data-source="spec/Spec%20Additions.md#L106">
                The header for this section was written as
              </p>
              <pre data-source="spec/Spec%20Additions.md#L108-L110">
                <code>#### 3.2.3.8. Custom Numbers{"\n"}</code>
              </pre>
            </section>
            <section id="sec-Appendix-Annex-Sections" secid="3.3.4.9">
              <h4 data-source="spec/Spec%20Additions.md#L112">
                <span className="spec-secid" title="link to this section">
                  <a href="#sec-Appendix-Annex-Sections">3.3.4.9</a>
                </span>
                Appendix / Annex Sections
              </h4>
              <p data-source="spec/Spec%20Additions.md#L114-L115">
                If a top level section is written with a letter, such as{" "}
                <code>A</code> instead of a number, that will begin an Appendix
                section.
              </p>
              <pre data-source="spec/Spec%20Additions.md#L117-L119">
                <code># A. Appendix: Grammar{"\n"}</code>
              </pre>
            </section>
          </section>
        </section>
        <section id="sec-Smart-Characters" secid="3.4">
          <h2 data-source="spec/Spec%20Additions.md#L122">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Smart-Characters">3.4</a>
            </span>
            Smart Characters
          </h2>
          <p data-source="spec/Spec%20Additions.md#L124-L126">
            The Spec Markdown renderer will replace easy to type characters like
            quotes and dashes with their appropriate typographic entities. These
            replacements will not occur within blocks of code.
          </p>
          <section id="sec-Quotes-and-Dashes" secid="3.4.1">
            <h3 data-source="spec/Spec%20Additions.md#L129">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Quotes-and-Dashes">3.4.1</a>
              </span>
              Quotes and Dashes
            </h3>
            <p data-source="spec/Spec%20Additions.md#L131-L132">
              Prose text has “smart quotes”, hyphens, en-dashes and
              em-dashes—you shouldn’t have to think about it, they’ll just work.
            </p>
            <p data-source="spec/Spec%20Additions.md#L134">
              For example, a quote of a quote (with an inner apostrophe and
              emphasis for flair):
            </p>
            <p data-source="spec/Spec%20Additions.md#L136">
              <code>
                "She told me that 'he isn't here right *now*' - so I left."
              </code>
            </p>
            <p data-source="spec/Spec%20Additions.md#L138">Will render as:</p>
            <p data-source="spec/Spec%20Additions.md#L140">
              “She told me that ‘he isn’t here right <em>now</em>’ – so I left.”
            </p>
            <p data-source="spec/Spec%20Additions.md#L142">
              Escaped <code>\"quotes \'and single\-quotes\'\"</code> becomes:
              \“quotes \‘and single-quotes'".
            </p>
          </section>
          <section id="sec-Math" secid="3.4.2">
            <h3 data-source="spec/Spec%20Additions.md#L144">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Math">3.4.2</a>
              </span>
              Math
            </h3>
            <p data-source="spec/Spec%20Additions.md#L146">
              Math operators like ≥, ≤, and ≈ can be written as{" "}
              <code>&gt;=</code>, <code>&lt;=</code>, and <code>~=</code>.
            </p>
            <p data-source="spec/Spec%20Additions.md#L148">
              Escaped <code>\&gt;= \&lt;= \~=</code> becomes: &gt;= &lt;= ~=.
            </p>
          </section>
          <section id="sec-Arrows" secid="3.4.3">
            <h3 data-source="spec/Spec%20Additions.md#L150">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Arrows">3.4.3</a>
              </span>
              Arrows
            </h3>
            <p data-source="spec/Spec%20Additions.md#L152">
              Smart arrows → and ← and ↔ can be written as <code>-&gt;</code>,{" "}
              <code>&lt;-</code> and <code>&lt;-&gt;</code>.
            </p>
            <p data-source="spec/Spec%20Additions.md#L154">
              Fat smart arrows ⇒ and ⇐ and ⇔ can be written as{" "}
              <code>=&gt;</code>, <code>&lt;==</code> and <code>&lt;=&gt;</code>
              .
            </p>
            <p data-source="spec/Spec%20Additions.md#L156">
              Escaped{" "}
              <code>\-&gt; \&lt;- \&lt;-&gt; \=&gt; \&lt;== \&lt;=&gt;</code>{" "}
              becomes: -&gt; &lt;- &lt;-&gt; =&gt; &lt;== &lt;=&gt;.
            </p>
          </section>
        </section>
        <section id="sec-Tables" secid="3.5">
          <h2 data-source="spec/Spec%20Additions.md#L159">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Tables">3.5</a>
            </span>
            Tables
          </h2>
          <p data-source="spec/Spec%20Additions.md#L161">
            Similar to Github flavored Markdown
          </p>
          <pre data-source="spec/Spec%20Additions.md#L163-L167">
            <code>
              | This | is a | table |{"\n"}| ---- | ---: | :---: |{"\n"}| key
              {"  "}| val{"  "}| etc{"   "}|{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L169">
            Produces the following:
          </p>
          <table>
            <thead>
              <tr data-source="spec/Spec%20Additions.md#L171">
                <th>This</th>
                <th align="right">is a</th>
                <th align="center">table</th>
              </tr>
            </thead>
            <tbody>
              <tr data-source="spec/Spec%20Additions.md#L173">
                <td>key</td>
                <td align="right">val</td>
                <td align="center">etc</td>
              </tr>
            </tbody>
          </table>
          <p data-source="spec/Spec%20Additions.md#L175">
            Table cells can contain any content that a paragraph can contain.
          </p>
        </section>
        <section id="sec-Comments" secid="3.6">
          <h2 data-source="spec/Spec%20Additions.md#L177">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Comments">3.6</a>
            </span>
            Comments
          </h2>
          <p data-source="spec/Spec%20Additions.md#L179-L181">
            Spec Markdown will ignore HTML style comments before or within
            blocks of text. By default these comments are omitted from the
            resulting HTML, but can be included by passing the option{" "}
            <code>--includeComments</code> when calling <code>spec-md</code>.
          </p>
          <p data-source="spec/Spec%20Additions.md#L183">
            For example this paragraph:
          </p>
          <pre data-source="spec/Spec%20Additions.md#L185-L187">
            <code>
              This is a &lt;!-- comment inside of a --&gt; paragraph.{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L189">
            Produces the following:
          </p>
          <p data-source="spec/Spec%20Additions.md#L191">
            This is a paragraph.
          </p>
        </section>
        <section id="sec-Definitions" secid="3.7">
          <h2 data-source="spec/Spec%20Additions.md#L193">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Definitions">3.7</a>
            </span>
            Definitions
          </h2>
          <p data-source="spec/Spec%20Additions.md#L195-L196">
            Spec Markdown provides two forms for defining terms, definition
            lists and definition paragraphs.
          </p>
          <section id="sec-Definition-List" secid="3.7.1">
            <h3 data-source="spec/Spec%20Additions.md#L198">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Definition-List">3.7.1</a>
              </span>
              Definition List
            </h3>
            <p data-source="spec/Spec%20Additions.md#L200-L201">
              A definition list is written as a defined term on a single line
              followed by one or more definition lines, each starting with a{" "}
              <code>: </code>.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L203-L208">
              <code>
                Cookie{"\n"}:{"   "}A small piece of data that a server sends to
                the user's web browser. The{"\n"}
                {"    "}browser may store it and send it back with later
                requests to the same server.{"\n"}:{"   "}A delicious snack,
                often containing chocolate chips.{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L210">
              Produces the following:
            </p>
            <dl>
              <dt data-source="spec/Spec%20Additions.md#L212-L215">
                <dfn id="cookie">
                  <a href="#cookie" data-name="cookie">
                    Cookie
                  </a>
                </dfn>
              </dt>
              <dd data-source="spec/Spec%20Additions.md#L213-L214">
                A small piece of data that a server sends to the user’s web
                browser. The browser may store it and send it back with later
                requests to the same server.
              </dd>
              <dd data-source="spec/Spec%20Additions.md#L215">
                A delicious snack, often containing chocolate chips.
              </dd>
            </dl>
            <div
              id="note-c914f"
              className="spec-note"
              data-source="spec/Spec%20Additions.md#L217"
            >
              <a href="#note-c914f">Note</a>
              Term definitions can optionally be separated by a single blank
              line.
            </div>
          </section>
          <section id="sec-Definition-Paragraph" secid="3.7.2">
            <h3 data-source="spec/Spec%20Additions.md#L219">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Definition-Paragraph">3.7.2</a>
              </span>
              Definition Paragraph
            </h3>
            <p data-source="spec/Spec%20Additions.md#L221-L222">
              A definition paragraph starts with a <code>:: </code> and contains
              an italicized term. This is useful when it is easier to define a
              term in a sentence containing that term.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L224-L226">
              <code>
                :: The study of *Philosophy* investigates general and
                fundamental questions.{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L228">
              Produces the following:
            </p>
            <p data-source="spec/Spec%20Additions.md#L230">
              The study of{" "}
              <dfn id="philosophy">
                <a href="#philosophy" data-name="philosophy">
                  Philosophy
                </a>
              </dfn>{" "}
              investigates general and fundamental questions.
            </p>
          </section>
          <section id="sec-Definition-References" secid="3.7.3">
            <h3 data-source="spec/Spec%20Additions.md#L232">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Definition-References">3.7.3</a>
              </span>
              Definition References
            </h3>
            <p data-source="spec/Spec%20Additions.md#L234-L235">
              A defined term can be later referenced by italicizing that term.
              Referenced terms are case insensitive.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L237-L239">
              <code>
                After studying *philosophy*, you may eat a *cookie*.{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L241">
              Produces the following:
            </p>
            <p data-source="spec/Spec%20Additions.md#L243">
              After studying{" "}
              <span className="spec-ref">
                <a href="#philosophy" data-name="philosophy">
                  philosophy
                </a>
              </span>
              , you may eat a{" "}
              <span className="spec-ref">
                <a href="#cookie" data-name="cookie">
                  cookie
                </a>
              </span>
              .
            </p>
          </section>
        </section>
        <section id="sec-Note" secid="3.8">
          <h2 data-source="spec/Spec%20Additions.md#L245">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Note">3.8</a>
            </span>
            Note
          </h2>
          <p data-source="spec/Spec%20Additions.md#L247-L249">
            Notes can be written inline with a spec document, and are often
            helpful to supply non-normative explanatory text or caveats in a
            differently formatted style. Case insensitive, the <code>:</code> is
            optional.
          </p>
          <p data-source="spec/Spec%20Additions.md#L251-L254">
            Notes automatically have short links generated for them. If the
            contents of the note changes, so will the link URL. However if a
            note moves around, or content around the note changes the existing
            links will still point to the right place, very useful for
            consistently evolving specifications!
          </p>
          <pre data-source="spec/Spec%20Additions.md#L256-L258">
            <code>Note: Notes are awesome.{"\n"}</code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L260">
            Produces the following:
          </p>
          <div
            id="note-cf2ae"
            className="spec-note"
            data-source="spec/Spec%20Additions.md#L262"
          >
            <a href="#note-cf2ae">Note</a>
            Notes are awesome.
          </div>
        </section>
        <section id="sec-Todo" secid="3.9">
          <h2 data-source="spec/Spec%20Additions.md#L265">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Todo">3.9</a>
            </span>
            Todo
          </h2>
          <p data-source="spec/Spec%20Additions.md#L267-L268">
            It’s often helpful to write a draft of a document and leave “to-do”
            comments in not-yet-completed sections. Case insensitive, the{" "}
            <code>:</code> is optional.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L270-L272">
            <code>TODO: finish this section{"\n"}</code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L274">
            Produces the following:
          </p>
          <div
            className="spec-todo"
            data-source="spec/Spec%20Additions.md#L276"
          >
            finish this section
          </div>
          <div
            id="note-2ac5f"
            className="spec-note"
            data-source="spec/Spec%20Additions.md#L278"
          >
            <a href="#note-2ac5f">Note</a>
            You can also write <code>TK</code> in place of <code>TODO</code>,
            nerds.
          </div>
        </section>
        <section id="sec-Syntax-Highlighting" secid="3.10">
          <h2 data-source="spec/Spec%20Additions.md#L281">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Syntax-Highlighting">3.10</a>
            </span>
            Syntax Highlighting
          </h2>
          <p data-source="spec/Spec%20Additions.md#L283-L284">
            Spec Markdown will apply syntax highlighting to blocks of code if a
            github-flavored-markdown style language is supplied.
          </p>
          <p data-source="spec/Spec%20Additions.md#L286">
            You may provide a <code>highlight</code> function as an option to
            customize this behavior.
          </p>
          <p data-source="spec/Spec%20Additions.md#L288">
            To render this highlighted javascript:
          </p>
          <pre data-source="spec/Spec%20Additions.md#L290-L292">
            <code>
              ```js{"\n"}const baz = foo("bar");{"\n"}```
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L294">
            Produces the following:
          </p>
          <pre
            data-language="js"
            data-source="spec/Spec%20Additions.md#L296-L298"
          >
            <code>
              <span className="token keyword">const</span> baz{" "}
              <span className="token operator">=</span>{" "}
              <span className="token function">foo</span>
              <span className="token punctuation">(</span>
              <span className="token string">"bar"</span>
              <span className="token punctuation">)</span>
              <span className="token punctuation">;</span>
              {"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L300-L301">
            You may also prefix your highlight function with “raw” if you want
            to avoid other tools, such as Prettier, from interpreting a code
            block.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L303-L305">
            <code>
              ```raw js{"\n"}const baz = foo("bar");{"\n"}```
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L307">
            Produces the following:
          </p>
          <pre
            data-language="js"
            data-source="spec/Spec%20Additions.md#L309-L311"
          >
            <code>
              <span className="token keyword">const</span> baz{" "}
              <span className="token operator">=</span>{" "}
              <span className="token function">foo</span>
              <span className="token punctuation">(</span>
              <span className="token string">"bar"</span>
              <span className="token punctuation">)</span>
              <span className="token punctuation">;</span>
              {"\n"}
            </code>
          </pre>
          <section id="sec-Examples" secid="3.10.1">
            <h3 data-source="spec/Spec%20Additions.md#L313">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Examples">3.10.1</a>
              </span>
              Examples
            </h3>
            <p data-source="spec/Spec%20Additions.md#L315-L317">
              Spec Markdown helps you write examples, visually indicaticating
              the difference from normative code blocks, and generating
              permalinks to those examples. Just write <code>example</code>{" "}
              after the <code>```</code>.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L319-L321">
              <code>
                ```example{"\n"}const great = useOf.example("code");{"\n"}```
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L323">
              Produces the following:
            </p>
            <pre
              id="example-33270"
              className="spec-example"
              data-source="spec/Spec%20Additions.md#L325-L327"
            >
              <a href="#example-33270">Example № 6</a>
              <code>const great = useOf.example("code");{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L329-L330">
              Examples can also be syntax highlighted, by placing the language
              directly before writing <code>example</code>:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L332-L334">
              <code>
                ```js example{"\n"}const great = useOf.example("code");{"\n"}```
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L336">
              Produces the following:
            </p>
            <pre
              id="example-d7c75"
              className="spec-example"
              data-language="js"
              data-source="spec/Spec%20Additions.md#L338-L340"
            >
              <a href="#example-d7c75">Example № 7</a>
              <code>
                <span className="token keyword">const</span> great{" "}
                <span className="token operator">=</span> useOf
                <span className="token punctuation">.</span>
                <span className="token method function property-access">
                  example
                </span>
                <span className="token punctuation">(</span>
                <span className="token string">"code"</span>
                <span className="token punctuation">)</span>
                <span className="token punctuation">;</span>
                {"\n"}
              </code>
            </pre>
          </section>
          <section id="sec-Counter-Examples" secid="3.10.2">
            <h3 data-source="spec/Spec%20Additions.md#L342">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Counter-Examples">3.10.2</a>
              </span>
              Counter Examples
            </h3>
            <p data-source="spec/Spec%20Additions.md#L344-L347">
              In addition to examples, Spec Markdown helps you write{" "}
              <em>counter-examples</em>, which are examples of things you should
              not do. These are visually indicated as different from normative
              code blocks and other examples. Just write{" "}
              <code>counter-example</code> after the <code>```</code> (and
              optional language).
            </p>
            <pre data-source="spec/Spec%20Additions.md#L349-L351">
              <code>
                ```js counter-example{"\n"}const shit = dontSwear();{"\n"}```
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L353">
              Produces the following:
            </p>
            <pre
              id="example-4c929"
              className="spec-counter-example"
              data-language="js"
              data-source="spec/Spec%20Additions.md#L355-L357"
            >
              <a href="#example-4c929">Counter Example № 8</a>
              <code>
                <span className="token keyword">const</span> shit{" "}
                <span className="token operator">=</span>{" "}
                <span className="token function">dontSwear</span>
                <span className="token punctuation">(</span>
                <span className="token punctuation">)</span>
                <span className="token punctuation">;</span>
                {"\n"}
              </code>
            </pre>
          </section>
        </section>
        <section id="sec-Imports" secid="3.11">
          <h2 data-source="spec/Spec%20Additions.md#L360">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Imports">3.11</a>
            </span>
            Imports
          </h2>
          <p data-source="spec/Spec%20Additions.md#L362-L363">
            When compiled, an import reference will be inlined into the same
            document. An import reference looks like a link to a “.md” file as a
            single paragraph.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L365-L367">
            <code>[AnythingGoesHere](SomeName.md){"\n"}</code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L369-L371">
            You can optionally prefix the import reference with <code>#</code>{" "}
            characters to describe at what section level the import should
            apply. By default an import reference will be imported as a child of
            the current section.
          </p>
        </section>
        <section id="sec-Inline-editing" secid="3.12">
          <h2 data-source="spec/Spec%20Additions.md#L374">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Inline-editing">3.12</a>
            </span>
            Inline editing
          </h2>
          <p data-source="spec/Spec%20Additions.md#L376">
            A portion of the <a href="http://criticmarkup.com/">CriticMarkup</a>{" "}
            spec is supported.
          </p>
          <p data-source="spec/Spec%20Additions.md#L378-L379">
            For example, we can <ins>add</ins> or <del>remove</del> text with
            the{" "}
            <code>
              {"{"}++add++{"}"}
            </code>{" "}
            or{" "}
            <code>
              {"{"}--remove--{"}"}
            </code>{" "}
            syntax.
          </p>
        </section>
        <section id="sec-Block-editing" secid="3.13">
          <h2 data-source="spec/Spec%20Additions.md#L382">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Block-editing">3.13</a>
            </span>
            Block editing
          </h2>
          <p data-source="spec/Spec%20Additions.md#L384-L385">
            We can also add and remove entire blocks of content, by using{" "}
            <code>{"{"}++</code> or <code>{"{"}--</code> on their own line with
            empty lines on either side:
          </p>
          <div
            className="spec-added"
            data-source="spec/Spec%20Additions.md#L387-L393"
          >
            <p data-source="spec/Spec%20Additions.md#L389">These paragraphs</p>
            <p data-source="spec/Spec%20Additions.md#L391">
              have been <em>added</em>.
            </p>
          </div>
          <p data-source="spec/Spec%20Additions.md#L395">And</p>
          <div
            className="spec-removed"
            data-source="spec/Spec%20Additions.md#L397-L403"
          >
            <p data-source="spec/Spec%20Additions.md#L399">These paragraphs</p>
            <p data-source="spec/Spec%20Additions.md#L401">
              have been <em>removed</em>.
            </p>
          </div>
          <p data-source="spec/Spec%20Additions.md#L405">By typing:</p>
          <pre data-source="spec/Spec%20Additions.md#L407-L425">
            <code>
              {"{"}++{"\n"}
              {"\n"}These paragraphs{"\n"}
              {"\n"}have been *added*.{"\n"}
              {"\n"}++{"}"}
              {"\n"}
              {"\n"}And{"\n"}
              {"\n"}
              {"{"}--{"\n"}
              {"\n"}These paragraphs{"\n"}
              {"\n"}have been *removed*.{"\n"}
              {"\n"}--{"}"}
              {"\n"}
            </code>
          </pre>
          <div
            id="note-e394e"
            className="spec-note"
            data-source="spec/Spec%20Additions.md#L427-L428"
          >
            <a href="#note-e394e">Note</a>
            imports and section headers cannot be included in a added or removed
            section to preserve the ability to render a table of contents.
          </div>
        </section>
        <section id="sec-Algorithms" secid="3.14">
          <h2 data-source="spec/Spec%20Additions.md#L432">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Algorithms">3.14</a>
            </span>
            Algorithms
          </h2>
          <p data-source="spec/Spec%20Additions.md#L434-L437">
            Specifications for procedures or algorithms can be defined in terms
            of nested markdown lists. These lists can be of any kind, but will
            always have ordered formatting. The bullet labeling for algorithms
            is specific will cycle between decimal, lower-alpha, and
            lower-roman.
          </p>
          <p data-source="spec/Spec%20Additions.md#L439">
            An algorithm definition also describes its arguments in terms of
            variables.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L441-L450">
            <code>
              Algorithm(arg) :{"\n"}
              {"  "}1. first{"\n"}
              {"  "}1. then{"\n"}
              {"    "}* substep{"\n"}
              {"      "}* deeper substep{"\n"}
              {"      "}* another deep substep{"\n"}
              {"    "}* another step{"\n"}
              {"  "}1. okay{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L452">
            Produces the following:
          </p>
          <div
            className="spec-algo"
            id="Algorithm()"
            data-source="spec/Spec%20Additions.md#L454-L461"
          >
            <span className="spec-call">
              <a href="#Algorithm()" data-name="Algorithm">
                Algorithm
              </a>
              (<var data-name="arg">arg</var>)
            </span>
            <ol>
              <li data-source="spec/Spec%20Additions.md#L455">first</li>
              <li data-source="spec/Spec%20Additions.md#L456-L460">
                then
                <ol>
                  <li data-source="spec/Spec%20Additions.md#L457-L459">
                    substep
                    <ol>
                      <li data-source="spec/Spec%20Additions.md#L458">
                        deeper substep
                      </li>
                      <li data-source="spec/Spec%20Additions.md#L459">
                        another deep substep
                      </li>
                    </ol>
                  </li>
                  <li data-source="spec/Spec%20Additions.md#L460">
                    another step
                  </li>
                </ol>
              </li>
              <li data-source="spec/Spec%20Additions.md#L461">okay</li>
            </ol>
          </div>
        </section>
        <section id="sec-Grammar" secid="3.15">
          <h2 data-source="spec/Spec%20Additions.md#L465">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Grammar">3.15</a>
            </span>
            Grammar
          </h2>
          <p data-source="spec/Spec%20Additions.md#L467">
            Spec Markdown makes it easier to describe context-free grammatical
            productions.
          </p>
          <p data-source="spec/Spec%20Additions.md#L469-L471">
            Grammars are defined by a sequence of <em>terminal</em> characters
            or sequence of characters, which are then referenced by{" "}
            <em>non-terminal</em> rules. The definition of a non-terminal is
            referred to as a <em>production</em>.
          </p>
          <section id="sec-Grammar-Production" secid="3.15.1">
            <h3 data-source="spec/Spec%20Additions.md#L474">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Grammar-Production">3.15.1</a>
              </span>
              Grammar Production
            </h3>
            <p data-source="spec/Spec%20Additions.md#L476-L477">
              The <code>:</code> token indicates an “is defined as” production
              for a non-terminal, where a single definition can be written
              directly after the <code>:</code>.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L479-L481">
              <code>PBJ : Bread PeanutButter Jelly Bread{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L483">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="PBJ"
              data-source="spec/Spec%20Additions.md#L485"
            >
              <span className="spec-nt">
                <a href="#PBJ" data-name="PBJ">
                  PBJ
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L487-L488">
              Or if{" "}
              <span className="spec-nt">
                <a href="#PBJ" data-name="PBJ">
                  PBJ
                </a>
              </span>{" "}
              has definition options, they are written immediately after as a
              Markdown list.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L490-L494">
              <code>
                PBJ :{"\n"}
                {"  "}- Bread PeanutButter Jelly Bread{"\n"}
                {"  "}- Bread Jelly PeanutButter Bread{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L496">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="PBJ"
              data-source="spec/Spec%20Additions.md#L498-L500"
            >
              <span className="spec-nt">
                <a href="#PBJ" data-name="PBJ">
                  PBJ
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L502-L503">
              Each definition is a space seperated list of <em>terminal</em> or{" "}
              <em>non-terminal</em> tokens, and may also include conditionals
              and constraints.
            </p>
            <p data-source="spec/Spec%20Additions.md#L505">
              Definition lists aren’t required to be indented:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L507-L512">
              <code>
                PBJ :{"\n"}
                {"\n"}- Bread PeanutButter Jelly Bread{"\n"}- Bread Jelly
                PeanutButter Bread{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L514">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="PBJ"
              data-source="spec/Spec%20Additions.md#L516-L519"
            >
              <span className="spec-nt">
                <a href="#PBJ" data-name="PBJ">
                  PBJ
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
            </div>
          </section>
          <section id="sec-Production-types" secid="3.15.2">
            <h3 data-source="spec/Spec%20Additions.md#L522">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Production-types">3.15.2</a>
              </span>
              Production types
            </h3>
            <p data-source="spec/Spec%20Additions.md#L524-L527">
              Often languages wish to specify different types of grammar
              productions, such as lexical or syntactical, or if certain
              characters line whitespace or newlines are permitted between
              symbols in the right-hand-side. Spec-md allows this this
              distinction based on the number of colons:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L529-L535">
              <code>
                TypeOne : `type` `one`{"\n"}
                {"\n"}TypeTwo :: `type` `two`{"\n"}
                {"\n"}TypeThree ::: `type` `three`{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L537">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="TypeOne"
              data-source="spec/Spec%20Additions.md#L539"
            >
              <span className="spec-nt">
                <a href="#TypeOne" data-name="TypeOne">
                  TypeOne
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">type</span>
                <span className="spec-t">one</span>
              </div>
            </div>
            <div
              className="spec-production d2"
              id="TypeTwo"
              data-source="spec/Spec%20Additions.md#L541"
            >
              <span className="spec-nt">
                <a href="#TypeTwo" data-name="TypeTwo">
                  TypeTwo
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">type</span>
                <span className="spec-t">two</span>
              </div>
            </div>
            <div
              className="spec-production d3"
              id="TypeThree"
              data-source="spec/Spec%20Additions.md#L543"
            >
              <span className="spec-nt">
                <a href="#TypeThree" data-name="TypeThree">
                  TypeThree
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">type</span>
                <span className="spec-t">three</span>
              </div>
            </div>
          </section>
          <section id="sec-One-of" secid="3.15.3">
            <h3 data-source="spec/Spec%20Additions.md#L546">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-One-of">3.15.3</a>
              </span>
              One of
            </h3>
            <p data-source="spec/Spec%20Additions.md#L548-L549">
              If each definition option is a single token, it can be expressed
              as a “one of” expression instead of a markdown list.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L551-L553">
              <code>
                AssignmentOperator : one of *= `/=` %= += -= &lt;&lt;= &gt;&gt;=
                &gt;&gt;&gt;= &amp;= ^= |={"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L555">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="AssignmentOperator"
              data-source="spec/Spec%20Additions.md#L557"
            >
              <span className="spec-nt">
                <a href="#AssignmentOperator" data-name="AssignmentOperator">
                  AssignmentOperator
                </a>
              </span>
              <div className="spec-oneof">
                <div className="spec-oneof-grid">
                  <table>
                    <tbody>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">*=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">/=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">%=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">+=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">-=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">&lt;&lt;=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">&gt;&gt;=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">&gt;&gt;&gt;=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">&amp;=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">^=</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">|=</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L560-L562">
              “one of” can also be followed by a line break and multiple lines
              of tokens. To improve legibility in other tools, each line may
              optionally begin with a bullet.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L564-L575">
              <code>
                Keyword : one of{"\n"}
                {"  "}- break{"     "}do{"        "}in{"          "}typeof{"\n"}
                {"  "}- case{"      "}else{"      "}instanceof{"  "}var{"\n"}
                {"  "}- catch{"     "}export{"    "}new{"         "}void{"\n"}
                {"  "}- class{"     "}extends{"   "}return{"      "}while{"\n"}
                {"  "}- const{"     "}finally{"   "}super{"       "}with{"\n"}
                {"  "}- continue{"  "}for{"       "}switch{"      "}yield{"\n"}
                {"  "}- debugger{"  "}function{"  "}this{"\n"}
                {"  "}- default{"   "}if{"        "}throw{"\n"}
                {"  "}- delete{"    "}import{"    "}try{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L577">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Keyword"
              data-source="spec/Spec%20Additions.md#L579-L588"
            >
              <span className="spec-nt">
                <a href="#Keyword" data-name="Keyword">
                  Keyword
                </a>
              </span>
              <div className="spec-oneof">
                <div className="spec-oneof-grid">
                  <table>
                    <tbody>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">break</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">do</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">in</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">typeof</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">case</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">else</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">instanceof</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">var</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">catch</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">export</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">new</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">void</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">class</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">extends</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">return</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">while</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">const</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">finally</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">super</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">with</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">continue</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">for</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">switch</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">yield</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">debugger</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">function</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">this</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">default</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">if</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">throw</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="spec-rhs">
                          <span className="spec-t">delete</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">import</span>
                        </td>
                        <td className="spec-rhs">
                          <span className="spec-t">try</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
          <section id="sec-Non-Terminal-Token" secid="3.15.4">
            <h3 data-source="spec/Spec%20Additions.md#L591">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Non-Terminal-Token">3.15.4</a>
              </span>
              Non Terminal Token
            </h3>
            <p data-source="spec/Spec%20Additions.md#L593-L596">
              Non-terminal tokens with a defined as a grammar production can be
              referred to in other grammar productions. Non-terminals must match
              the regular expression{" "}
              <span className="spec-rx">/[A-Z][_a-zA-Z]*/</span>. That is, they
              must start with an uppercase letter, followed by any number of
              letters or underscores.
            </p>
          </section>
          <section id="sec-Prose" secid="3.15.5">
            <h3 data-source="spec/Spec%20Additions.md#L600">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Prose">3.15.5</a>
              </span>
              Prose
            </h3>
            <p data-source="spec/Spec%20Additions.md#L602-L603">
              Grammars can describe arbitrary rules by using prose within a
              grammar definition by using <code>"quotes"</code>.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L605-L607">
              <code>Sandwich : Bread "Any kind of topping" Bread{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L609">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Sandwich"
              data-source="spec/Spec%20Additions.md#L611"
            >
              <span className="spec-nt">
                <a href="#Sandwich" data-name="Sandwich">
                  Sandwich
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
                <span className="spec-prose">Any kind of topping</span>
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>
              </div>
            </div>
          </section>
          <section id="sec-Terminal-Token" secid="3.15.6">
            <h3 data-source="spec/Spec%20Additions.md#L615">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Terminal-Token">3.15.6</a>
              </span>
              Terminal Token
            </h3>
            <p data-source="spec/Spec%20Additions.md#L617-L618">
              Terminal tokens refer to a character or sequence of characters.
              They can be written unadorned in the grammar definition.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L620-L622">
              <code>BalancedParens : ( BalancedParens ){"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L624">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="BalancedParens"
              data-source="spec/Spec%20Additions.md#L626"
            >
              <span className="spec-nt">
                <a href="#BalancedParens" data-name="BalancedParens">
                  BalancedParens
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">(</span>
                <span className="spec-nt">
                  <a href="#BalancedParens" data-name="BalancedParens">
                    BalancedParens
                  </a>
                </span>
                <span className="spec-t">)</span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L628">
              Any sequence of characters can be written to indicate a terminal
              token:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L630-L632">
              <code>
                WhileStatement : while ( Expression ) {"{"} Statements {"}"}
                {"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L634">Produces</p>
            <div
              className="spec-production"
              id="WhileStatement"
              data-source="spec/Spec%20Additions.md#L636"
            >
              <span className="spec-nt">
                <a href="#WhileStatement" data-name="WhileStatement">
                  WhileStatement
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">while</span>
                <span className="spec-t">(</span>
                <span className="spec-nt">
                  <span data-name="Expression">Expression</span>
                </span>
                <span className="spec-t">)</span>
                <span className="spec-t">{"{"}</span>
                <span className="spec-nt">
                  <span data-name="Statements">Statements</span>
                </span>
                <span className="spec-t">{"}"}</span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L638-L641">
              Terminals can also be quoted with back-ticks <code>`</code> to
              remove any ambiguity from other meanings, for example to allow a
              terminal token to start with an uppercase letter, or a slash{" "}
              <code>/</code> or backslash <code>\</code>, or later contain a{" "}
              <code>]</code> or <code>{"}"}</code>.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L643-L645">
              <code>DivisionExpression : Expression `/` Expression{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L647">Produces</p>
            <div
              className="spec-production"
              id="DivisionExpression"
              data-source="spec/Spec%20Additions.md#L649"
            >
              <span className="spec-nt">
                <a href="#DivisionExpression" data-name="DivisionExpression">
                  DivisionExpression
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="Expression">Expression</span>
                </span>
                <span className="spec-t">/</span>
                <span className="spec-nt">
                  <span data-name="Expression">Expression</span>
                </span>
              </div>
            </div>
          </section>
          <section id="sec-Regular-Expression" secid="3.15.7">
            <h3 data-source="spec/Spec%20Additions.md#L653">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Regular-Expression">3.15.7</a>
              </span>
              Regular Expression
            </h3>
            <p data-source="spec/Spec%20Additions.md#L655-L656">
              When a grammar is intended to be interpretted as a single token
              and can be clearly written as a regular expression, you can do so
              directly.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L658-L660">
              <code>UppercaseWord : /[A-Z][a-z]*/{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L662">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="UppercaseWord"
              data-source="spec/Spec%20Additions.md#L664"
            >
              <span className="spec-nt">
                <a href="#UppercaseWord" data-name="UppercaseWord">
                  UppercaseWord
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-rx">/[A-Z][a-z]*/</span>
              </div>
            </div>
          </section>
          <section id="sec-Quantifiers" secid="3.15.8">
            <h3 data-source="spec/Spec%20Additions.md#L668">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Quantifiers">3.15.8</a>
              </span>
              Quantifiers
            </h3>
            <p data-source="spec/Spec%20Additions.md#L670-L671">
              Tokens can be followed by quantifiers to alter their meaning and
              as a short-hand for common patterns of optionality and repetition.
            </p>
            <section id="sec-Quantifiers.Optional-Tokens" className="subsec">
              <h6 data-source="spec/Spec%20Additions.md#L674">
                <a
                  href="#sec-Quantifiers.Optional-Tokens"
                  title="link to this subsection"
                >
                  Optional Tokens
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L676-L677">
                A subscript suffix <code>Token?</code> renders as{" "}
                <span className="spec-quantified">
                  <span className="spec-nt">
                    <span data-name="Token">Token</span>
                  </span>
                  <span className="spec-quantifiers">
                    <span className="spec-quantifier optional">opt</span>
                  </span>
                </span>{" "}
                and is a shorthand for two possible definitions, one including
                that token and one excluding it.
              </p>
              <pre data-source="spec/Spec%20Additions.md#L679-L681">
                <code>Sentence : Noun Verb Adverb?{"\n"}</code>
              </pre>
              <p data-source="spec/Spec%20Additions.md#L683">
                Produces the following:
              </p>
              <div
                className="spec-production"
                id="Sentence"
                data-source="spec/Spec%20Additions.md#L685"
              >
                <span className="spec-nt">
                  <a href="#Sentence" data-name="Sentence">
                    Sentence
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Noun">Noun</span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Verb">Verb</span>
                  </span>
                  <span className="spec-quantified">
                    <span className="spec-nt">
                      <span data-name="Adverb">Adverb</span>
                    </span>
                    <span className="spec-quantifiers">
                      <span className="spec-quantifier optional">opt</span>
                    </span>
                  </span>
                </div>
              </div>
              <p data-source="spec/Spec%20Additions.md#L687">
                Which is shorthand for:
              </p>
              <div
                className="spec-production"
                id="Sentence"
                data-source="spec/Spec%20Additions.md#L689-L691"
              >
                <span className="spec-nt">
                  <a href="#Sentence" data-name="Sentence">
                    Sentence
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Noun">Noun</span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Verb">Verb</span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Adverb">Adverb</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Noun">Noun</span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Verb">Verb</span>
                  </span>
                </div>
              </div>
            </section>
            <section id="sec-Quantifiers.Token-Lists" className="subsec">
              <h6 data-source="spec/Spec%20Additions.md#L694">
                <a
                  href="#sec-Quantifiers.Token-Lists"
                  title="link to this subsection"
                >
                  Token Lists
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L696-L697">
                A subscript suffix <code>Token+</code> renders as{" "}
                <span className="spec-quantified">
                  <span className="spec-nt">
                    <span data-name="Token">Token</span>
                  </span>
                  <span className="spec-quantifiers">
                    <span className="spec-quantifier list">list</span>
                  </span>
                </span>{" "}
                and is shorthand for a list of one or more of that token.
              </p>
              <pre data-source="spec/Spec%20Additions.md#L699-L701">
                <code>Book : Cover Page+ Cover{"\n"}</code>
              </pre>
              <p data-source="spec/Spec%20Additions.md#L703">
                Produces the following:
              </p>
              <div
                className="spec-production"
                id="Book"
                data-source="spec/Spec%20Additions.md#L705"
              >
                <span className="spec-nt">
                  <a href="#Book" data-name="Book">
                    Book
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                  <span className="spec-quantified">
                    <span className="spec-nt">
                      <span data-name="Page">Page</span>
                    </span>
                    <span className="spec-quantifiers">
                      <span className="spec-quantifier list">list</span>
                    </span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                </div>
              </div>
              <p data-source="spec/Spec%20Additions.md#L707">
                Which, unless your specification document declares otherwise, is
                shorthand for:
              </p>
              <div
                className="spec-production"
                id="Book"
                data-source="spec/Spec%20Additions.md#L709"
              >
                <span className="spec-nt">
                  <a href="#Book" data-name="Book">
                    Book
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                  <span className="spec-nt">
                    <a href="#Page_list" data-name="Page_list">
                      Page_list
                    </a>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                </div>
              </div>
              <div
                className="spec-production"
                id="Page_list"
                data-source="spec/Spec%20Additions.md#L711-L713"
              >
                <span className="spec-nt">
                  <a href="#Page_list" data-name="Page_list">
                    Page_list
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <a href="#Page_list" data-name="Page_list">
                      Page_list
                    </a>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Page">Page</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Page">Page</span>
                  </span>
                </div>
              </div>
              <p data-source="spec/Spec%20Additions.md#L715-L716">
                Some specifications may wish to declare{" "}
                <span className="spec-quantified">
                  <span className="spec-nt">
                    <span data-name="Token">Token</span>
                  </span>
                  <span className="spec-quantifiers">
                    <span className="spec-quantifier list">list</span>
                  </span>
                </span>{" "}
                as a shorthand for a comma-separated list, in which case the
                previous example would be shorthand for:
              </p>
              <div
                className="spec-production"
                id="Book"
                data-source="spec/Spec%20Additions.md#L718"
              >
                <span className="spec-nt">
                  <a href="#Book" data-name="Book">
                    Book
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                  <span className="spec-nt">
                    <a href="#Page_list" data-name="Page_list">
                      Page_list
                    </a>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Cover">Cover</span>
                  </span>
                </div>
              </div>
              <div
                className="spec-production"
                id="Page_list"
                data-source="spec/Spec%20Additions.md#L720-L722"
              >
                <span className="spec-nt">
                  <a href="#Page_list" data-name="Page_list">
                    Page_list
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <a href="#Page_list" data-name="Page_list">
                      Page_list
                    </a>
                  </span>
                  <span className="spec-t">,</span>
                  <span className="spec-nt">
                    <span data-name="Page">Page</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Page">Page</span>
                  </span>
                </div>
              </div>
            </section>
            <section id="sec-Quantifiers.Optional-Lists" className="subsec">
              <h6 data-source="spec/Spec%20Additions.md#L725">
                <a
                  href="#sec-Quantifiers.Optional-Lists"
                  title="link to this subsection"
                >
                  Optional Lists
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L727-L728">
                A subscript suffix <code>Token*</code> renders as{" "}
                <span className="spec-quantified">
                  <span className="spec-nt">
                    <span data-name="Token">Token</span>
                  </span>
                  <span className="spec-quantifiers">
                    <span className="spec-quantifier list">list</span>
                    <span className="spec-quantifier optional">opt</span>
                  </span>
                </span>{" "}
                and is shorthand for an optional list, which describes zero or
                more of that token.
              </p>
              <pre data-source="spec/Spec%20Additions.md#L730-L732">
                <code>Sandwich : Bread Topping* Bread{"\n"}</code>
              </pre>
              <p data-source="spec/Spec%20Additions.md#L734">
                Produces the following:
              </p>
              <div
                className="spec-production"
                id="Sandwich"
                data-source="spec/Spec%20Additions.md#L736"
              >
                <span className="spec-nt">
                  <a href="#Sandwich" data-name="Sandwich">
                    Sandwich
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                  <span className="spec-quantified">
                    <span className="spec-nt">
                      <span data-name="Topping">Topping</span>
                    </span>
                    <span className="spec-quantifiers">
                      <span className="spec-quantifier list">list</span>
                      <span className="spec-quantifier optional">opt</span>
                    </span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                </div>
              </div>
              <p data-source="spec/Spec%20Additions.md#L738">
                Which is shorthand for:
              </p>
              <div
                className="spec-production"
                id="Sandwich"
                data-source="spec/Spec%20Additions.md#L740-L742"
              >
                <span className="spec-nt">
                  <a href="#Sandwich" data-name="Sandwich">
                    Sandwich
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                  <span className="spec-nt">
                    <a href="#Topping_list" data-name="Topping_list">
                      Topping_list
                    </a>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Bread">Bread</span>
                  </span>
                </div>
              </div>
              <div
                className="spec-production"
                id="Topping_list"
                data-source="spec/Spec%20Additions.md#L744-L746"
              >
                <span className="spec-nt">
                  <a href="#Topping_list" data-name="Topping_list">
                    Topping_list
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <a href="#Topping_list" data-name="Topping_list">
                      Topping_list
                    </a>
                  </span>
                  <span className="spec-nt">
                    <span data-name="Topping">Topping</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <span data-name="Topping">Topping</span>
                  </span>
                </div>
              </div>
            </section>
            <section
              id="sec-Quantifiers.Use-with-Non-Terminals"
              className="subsec"
            >
              <h6 data-source="spec/Spec%20Additions.md#L749">
                <a
                  href="#sec-Quantifiers.Use-with-Non-Terminals"
                  title="link to this subsection"
                >
                  Use with Non-Terminals
                </a>
              </h6>
              <p data-source="spec/Spec%20Additions.md#L751">
                Quantifiers also apply to non-terminal tokens with the same
                rules. For example:
              </p>
              <pre
                data-language="markdown"
                data-source="spec/Spec%20Additions.md#L753-L757"
              >
                <code>
                  UnionMembers :{"\n"}
                  {"  "}
                  <span className="token list punctuation">-</span> UnionMembers
                  | NamedType{"\n"}
                  {"  "}- <span className="token code keyword">`|`</span>?
                  NamedType
                  {"\n"}
                </code>
              </pre>
              <p data-source="spec/Spec%20Additions.md#L759">
                Produces the following:
              </p>
              <div
                className="spec-production"
                id="UnionMembers"
                data-source="spec/Spec%20Additions.md#L761-L763"
              >
                <span className="spec-nt">
                  <a href="#UnionMembers" data-name="UnionMembers">
                    UnionMembers
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <a href="#UnionMembers" data-name="UnionMembers">
                      UnionMembers
                    </a>
                  </span>
                  <span className="spec-t">|</span>
                  <span className="spec-nt">
                    <span data-name="NamedType">NamedType</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-quantified">
                    <span className="spec-t">|</span>
                    <span className="spec-quantifiers">
                      <span className="spec-quantifier optional">opt</span>
                    </span>
                  </span>
                  <span className="spec-nt">
                    <span data-name="NamedType">NamedType</span>
                  </span>
                </div>
              </div>
              <p data-source="spec/Spec%20Additions.md#L765-L766">
                However, unquoted non-terminals may use the <code>*</code>,{" "}
                <code>?</code> and <code>+</code> characters, so always quote
                the terminal if the intent is to apply a quantifer.
              </p>
              <pre
                id="example-10052"
                className="spec-counter-example"
                data-language="markdown"
                data-source="spec/Spec%20Additions.md#L768-L772"
              >
                <a href="#example-10052">Counter Example № 9</a>
                <code>
                  UnionMembers :{"\n"}
                  {"  "}
                  <span className="token list punctuation">-</span> UnionMembers
                  | NamedType{"\n"}
                  {"  "}
                  <span className="token list punctuation">-</span> |? NamedType
                  {"\n"}
                </code>
              </pre>
              <p data-source="spec/Spec%20Additions.md#L774">
                Produces the terminal <code>|?</code>, not an optional{" "}
                <code>|</code>:
              </p>
              <div
                className="spec-production"
                id="UnionMembers"
                data-source="spec/Spec%20Additions.md#L776-L778"
              >
                <span className="spec-nt">
                  <a href="#UnionMembers" data-name="UnionMembers">
                    UnionMembers
                  </a>
                </span>
                <div className="spec-rhs">
                  <span className="spec-nt">
                    <a href="#UnionMembers" data-name="UnionMembers">
                      UnionMembers
                    </a>
                  </span>
                  <span className="spec-t">|</span>
                  <span className="spec-nt">
                    <span data-name="NamedType">NamedType</span>
                  </span>
                </div>
                <div className="spec-rhs">
                  <span className="spec-t">|?</span>
                  <span className="spec-nt">
                    <span data-name="NamedType">NamedType</span>
                  </span>
                </div>
              </div>
            </section>
          </section>
          <section id="sec-Conditional-Parameters" secid="3.15.9">
            <h3 data-source="spec/Spec%20Additions.md#L780">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Conditional-Parameters">3.15.9</a>
              </span>
              Conditional Parameters
            </h3>
            <p data-source="spec/Spec%20Additions.md#L782-L783">
              It can be a useful short-hand to provide conditional parameters
              when defining a non-terminal token rather than defining two very
              similar non-terminals.
            </p>
            <p data-source="spec/Spec%20Additions.md#L785-L787">
              A conditional parameter is written in braces{" "}
              <code>Token[Param]</code> and renders as{" "}
              <span className="spec-nt">
                <span data-name="Token">Token</span>
                <span className="spec-params">
                  <span className="spec-param">Param</span>
                </span>
              </span>
              . When used in definitions is shorthand for two symbol
              definitions: one appended with that parameter name, the other
              without.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L789-L791">
              <code>Example[WithCondition] : "Definition TBD"{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L793">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L795"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
                <span className="spec-params">
                  <span className="spec-param">WithCondition</span>
                </span>
              </span>
              <div className="spec-rhs">
                <span className="spec-prose">Definition TBD</span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L797">
              Which is shorthand for:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L799"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-prose">Definition TBD</span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_WithCondition"
              data-source="spec/Spec%20Additions.md#L801"
            >
              <span className="spec-nt">
                <a
                  href="#Example_WithCondition"
                  data-name="Example_WithCondition"
                >
                  Example_WithCondition
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-prose">Definition TBD</span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L804-L807">
              The conditions are applied at the beginning of a definition for
              the non-terminal by prefixing with <code>[if Param]</code>{" "}
              (alternatively <code>[+Param]</code>) or{" "}
              <code>[if not Param]</code> (alternatively <code>[~Param]</code>)
              to only include the definition when the variant with the
              conditional parameter is or is not used, respectively.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L809-L817">
              <code>
                Example[WithCondition] :{"\n"}
                {"  "}- A{"\n"}
                {"  "}- [if WithCondition] B{"\n"}
                {"  "}- [if not WithCondition] C{"\n"}
                {"  "}- [+WithCondition] D{"\n"}
                {"  "}- [~WithCondition] E{"\n"}
                {"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L819">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L821-L826"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
                <span className="spec-params">
                  <span className="spec-param">WithCondition</span>
                </span>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="A">A</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-condition">WithCondition</span>
                <span className="spec-nt">
                  <span data-name="B">B</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-condition not">WithCondition</span>
                <span className="spec-nt">
                  <span data-name="C">C</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-condition">WithCondition</span>
                <span className="spec-nt">
                  <span data-name="D">D</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-condition not">WithCondition</span>
                <span className="spec-nt">
                  <span data-name="E">E</span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L828">
              Which is shorthand for:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L830-L833"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="A">A</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="C">C</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="E">E</span>
                </span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_WithCondition"
              data-source="spec/Spec%20Additions.md#L835-L838"
            >
              <span className="spec-nt">
                <a
                  href="#Example_WithCondition"
                  data-name="Example_WithCondition"
                >
                  Example_WithCondition
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="A">A</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="B">B</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="D">D</span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L841-L845">
              The same bracket suffix on a non-terminal within a rule is
              shorthand for using that variant of the rule. If the parameter
              starts with <code>?</code>, that form of the symbol is
              conditionally used only in the derived production with the same
              parameter. If the parameter starts with <code>!</code>, that form
              of the symbol is only used when in the derived production{" "}
              <em>without</em> that parameter.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L847-L853">
              <code>
                Example[WithCondition] :{"\n"}
                {"  "}- Example{"\n"}
                {"  "}- Example[WithCondition]{"\n"}
                {"  "}- Example[?WithCondition]{"\n"}
                {"  "}- Example[!WithCondition]{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L855">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L857-L861"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
                <span className="spec-params">
                  <span className="spec-param">WithCondition</span>
                </span>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                  <span className="spec-params">
                    <span className="spec-param">WithCondition</span>
                  </span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                  <span className="spec-params">
                    <span className="spec-param conditional">
                      WithCondition
                    </span>
                  </span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                  <span className="spec-params">
                    <span className="spec-param negated">WithCondition</span>
                  </span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L863">
              Which is shorthand for:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L865-L869"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a
                    href="#Example_WithCondition"
                    data-name="Example_WithCondition"
                  >
                    Example_WithCondition
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a
                    href="#Example_WithCondition"
                    data-name="Example_WithCondition"
                  >
                    Example_WithCondition
                  </a>
                </span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_WithCondition"
              data-source="spec/Spec%20Additions.md#L871-L875"
            >
              <span className="spec-nt">
                <a
                  href="#Example_WithCondition"
                  data-name="Example_WithCondition"
                >
                  Example_WithCondition
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a
                    href="#Example_WithCondition"
                    data-name="Example_WithCondition"
                  >
                    Example_WithCondition
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a
                    href="#Example_WithCondition"
                    data-name="Example_WithCondition"
                  >
                    Example_WithCondition
                  </a>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L878-L880">
              Multiple conditional parameters can be used on both the production
              definition and on non-terminals within a rule, in which case it is
              short form for the permutation of all conditions:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L882-L887">
              <code>
                Example[P, Q] :{"\n"}
                {"  "}- [if P] `p`{"\n"}
                {"  "}- [if Q] `q`{"\n"}
                {"  "}- Example[!P, ?Q]{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L889">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L891-L894"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
                <span className="spec-params">
                  <span className="spec-param">P</span>
                  <span className="spec-param">Q</span>
                </span>
              </span>
              <div className="spec-rhs">
                <span className="spec-condition">P</span>
                <span className="spec-t">p</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-condition">Q</span>
                <span className="spec-t">q</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                  <span className="spec-params">
                    <span className="spec-param negated">P</span>
                    <span className="spec-param conditional">Q</span>
                  </span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L896">
              Which is shorthand for:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L898-L899"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example_P" data-name="Example_P">
                    Example_P
                  </a>
                </span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_P"
              data-source="spec/Spec%20Additions.md#L901-L903"
            >
              <span className="spec-nt">
                <a href="#Example_P" data-name="Example_P">
                  Example_P
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">p</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                </span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_Q"
              data-source="spec/Spec%20Additions.md#L905-L907"
            >
              <span className="spec-nt">
                <a href="#Example_Q" data-name="Example_Q">
                  Example_Q
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">q</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example_P_Q" data-name="Example_P_Q">
                    Example_P_Q
                  </a>
                </span>
              </div>
            </div>
            <div
              className="spec-production"
              id="Example_P_Q"
              data-source="spec/Spec%20Additions.md#L909-L912"
            >
              <span className="spec-nt">
                <a href="#Example_P_Q" data-name="Example_P_Q">
                  Example_P_Q
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-t">p</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-t">q</span>
              </div>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <a href="#Example_Q" data-name="Example_Q">
                    Example_Q
                  </a>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L915">
              Conditional parameters on a usage can be followed by a quantifier.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L917-L919">
              <code>Example[P, ?Q]*{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L921">
              Produces the following:
            </p>
            <p data-source="spec/Spec%20Additions.md#L923">
              <span className="spec-quantified">
                <span className="spec-nt">
                  <a href="#Example" data-name="Example">
                    Example
                  </a>
                  <span className="spec-params">
                    <span className="spec-param">P</span>
                    <span className="spec-param conditional">Q</span>
                  </span>
                </span>
                <span className="spec-quantifiers">
                  <span className="spec-quantifier list">list</span>
                  <span className="spec-quantifier optional">opt</span>
                </span>
              </span>
            </p>
          </section>
          <section id="sec-Constraints" secid="3.15.10">
            <h3 data-source="spec/Spec%20Additions.md#L927">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Constraints">3.15.10</a>
              </span>
              Constraints
            </h3>
            <p data-source="spec/Spec%20Additions.md#L929-L930">
              Any token can be followed by “but not” or “but not one of” to
              place a further constraint on the previous token:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L932-L934">
              <code>Example : A B but not foo or bar{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L936">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L938"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="A">A</span>
                </span>
                <span className="spec-constrained">
                  <span className="spec-nt">
                    <span data-name="B">B</span>
                  </span>
                  <span className="spec-butnot">
                    <span className="spec-t">foo</span>
                    <span className="spec-t">bar</span>
                  </span>
                </span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L941-L942">
              Optionally can mention “one of”, this will be omitted when
              rendered. Commas can be used instead of “or”.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L944-L946">
              <code>Example : A B but not one of foo, bar{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L948">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L950"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-nt">
                  <span data-name="A">A</span>
                </span>
                <span className="spec-constrained">
                  <span className="spec-nt">
                    <span data-name="B">B</span>
                  </span>
                  <span className="spec-butnot">
                    <span className="spec-t">foo</span>
                    <span className="spec-t">bar</span>
                  </span>
                </span>
              </div>
            </div>
          </section>
          <section id="sec-Meta-Tokens" secid="3.15.11">
            <h3 data-source="spec/Spec%20Additions.md#L953">
              <span className="spec-secid" title="link to this section">
                <a href="#sec-Meta-Tokens">3.15.11</a>
              </span>
              Meta Tokens
            </h3>
            <p data-source="spec/Spec%20Additions.md#L955">
              Spec Markdown can specify some tokens which do not consume any
              characters.
            </p>
            <p data-source="spec/Spec%20Additions.md#L957-L958">
              The empty set, written <code>[empty]</code> appears as{" "}
              <span className="spec-empty">[empty]</span> can be used to define
              a non-terminal as matching no terminal or non-terminal tokens.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L960-L962">
              <code>Example : [empty]{"\n"}</code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L964">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L966"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-empty">[empty]</span>
              </div>
            </div>
            <p data-source="spec/Spec%20Additions.md#L969-L970">
              Lookaheads can appear anywhere in a sequence of tokens, and
              describe additional constraints on the following token.
            </p>
            <pre data-source="spec/Spec%20Additions.md#L972-L983">
              <code>
                Example :{"\n"}
                {"  "}- [lookahead token] Token{"\n"}
                {"  "}- [lookahead ! token] Token{"\n"}
                {"  "}- [lookahead != token] Token{"\n"}
                {"  "}- [lookahead NonTerminal] Token{"\n"}
                {"  "}- [lookahead ! NonTerminal] Token{"\n"}
                {"  "}- [lookahead != NonTerminal] Token{"\n"}
                {"  "}- [lookahead {"{"}token, set{"}"}] Token{"\n"}
                {"  "}- [lookahead ! {"{"}token, set{"}"}] Token{"\n"}
                {"  "}- [lookahead != {"{"}token, set{"}"}] Token{"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L985">
              Produces the following:
            </p>
            <div
              className="spec-production"
              id="Example"
              data-source="spec/Spec%20Additions.md#L987-L996"
            >
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              <div className="spec-rhs">
                <span className="spec-lookahead">
                  <span className="spec-t">token</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead not">
                  <span className="spec-t">token</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead not">
                  <span className="spec-t">token</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead ntset">
                  <span className="spec-nt">
                    <span data-name="NonTerminal">NonTerminal</span>
                  </span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead ntset not">
                  <span className="spec-nt">
                    <span data-name="NonTerminal">NonTerminal</span>
                  </span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead ntset not">
                  <span className="spec-nt">
                    <span data-name="NonTerminal">NonTerminal</span>
                  </span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead set">
                  <span className="spec-t">token</span>
                  <span className="spec-t">set</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead set not">
                  <span className="spec-t">token</span>
                  <span className="spec-t">set</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
              <div className="spec-rhs">
                <span className="spec-lookahead set not">
                  <span className="spec-t">token</span>
                  <span className="spec-t">set</span>
                </span>
                <span className="spec-nt">
                  <span data-name="Token">Token</span>
                </span>
              </div>
            </div>
          </section>
        </section>
        <section id="sec-Grammar-Semantics" secid="3.16">
          <h2 data-source="spec/Spec%20Additions.md#L1000">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Grammar-Semantics">3.16</a>
            </span>
            Grammar Semantics
          </h2>
          <p data-source="spec/Spec%20Additions.md#L1002-L1004">
            Once grammar is defined, it can be useful to define the semantics of
            the grammar in terms of algorithm steps. A single grammar definition
            followed by a list is interpretted as a grammar semantic:
          </p>
          <pre data-source="spec/Spec%20Additions.md#L1006-L1017">
            <code>
              PBJ : Bread PeanutButter Jelly Bread{"\n"}
              {"\n"}* Let {"{"}bottomBread{"}"} be the result of placing the
              first {"{"}Bread{"}"} on the plate.{"\n"}* Let {"{"}pbSpread{"}"}{" "}
              be the result of getting {"{"}PeanutButter{"}"} from the jar.
              {"\n"}* Spread {"{"}pbSpread{"}"} onto {"{"}bottomBread{"}"}.
              {"\n"}* Let {"{"}
              topBread{"}"} be the result of placing the last {"{"}Bread{"}"} on
              the plate.{"\n"}* Let {"{"}jamSpread{"}"} be the result of getting{" "}
              {"{"}
              Jelly{"}"} from the jar.{"\n"}* Spread {"{"}jamSpread{"}"} onto{" "}
              {"{"}
              topBread{"}"}.{"\n"}* Let {"{"}sandwich{"}"} be the result of
              rotating {"{"}topBread{"}"} 180&amp;deg; and placing on {"{"}
              bottomBread{"}"}.{"\n"}* Return {"{"}sandwich{"}"}.{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L1019">
            Produces the following:
          </p>
          <div
            className="spec-semantic"
            data-source="spec/Spec%20Additions.md#L1021-L1030"
          >
            <span className="spec-nt">
              <a href="#PBJ" data-name="PBJ">
                PBJ
              </a>
            </span>
            <div className="spec-rhs">
              <span className="spec-nt">
                <span data-name="Bread">Bread</span>
              </span>
              <span className="spec-nt">
                <span data-name="PeanutButter">PeanutButter</span>
              </span>
              <span className="spec-nt">
                <span data-name="Jelly">Jelly</span>
              </span>
              <span className="spec-nt">
                <span data-name="Bread">Bread</span>
              </span>
            </div>
            <ol>
              <li data-source="spec/Spec%20Additions.md#L1023">
                Let <var data-name="bottomBread">bottomBread</var> be the result
                of placing the first{" "}
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>{" "}
                on the plate.
              </li>
              <li data-source="spec/Spec%20Additions.md#L1024">
                Let <var data-name="pbSpread">pbSpread</var> be the result of{" "}
                <span className="spec-nt">
                  <span data-name="PeanutButter">PeanutButter</span>
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1025">
                Spread <var data-name="pbSpread">pbSpread</var> onto{" "}
                <var data-name="bottomBread">bottomBread</var>.
              </li>
              <li data-source="spec/Spec%20Additions.md#L1026">
                Let <var data-name="topBread">topBread</var> be the result of
                placing the last{" "}
                <span className="spec-nt">
                  <span data-name="Bread">Bread</span>
                </span>{" "}
                on the plate.
              </li>
              <li data-source="spec/Spec%20Additions.md#L1027">
                Let <var data-name="jamSpread">jamSpread</var> be the result of{" "}
                <span className="spec-nt">
                  <span data-name="Jelly">Jelly</span>
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1028">
                Spread <var data-name="jamSpread">jamSpread</var> onto{" "}
                <var data-name="topBread">topBread</var>.
              </li>
              <li data-source="spec/Spec%20Additions.md#L1029">
                Let <var data-name="sandwich">sandwich</var> be the result of
                rotating <var data-name="topBread">topBread</var> 180° and
                placing on <var data-name="bottomBread">bottomBread</var>.
              </li>
              <li data-source="spec/Spec%20Additions.md#L1030">
                Return <var data-name="sandwich">sandwich</var>.
              </li>
            </ol>
          </div>
        </section>
        <section id="sec-Value-Literals" secid="3.17">
          <h2 data-source="spec/Spec%20Additions.md#L1034">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Value-Literals">3.17</a>
            </span>
            Value Literals
          </h2>
          <p data-source="spec/Spec%20Additions.md#L1036-L1037">
            Value literals allow any text to refer to a value which has semantic
            meaning in the specification by wrapping it in{" "}
            <code>
              {"{"} {"}"}
            </code>{" "}
            curly brace characters.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L1039-L1041">
            <code>
              I can reference {"{"}foo{"}"}, {"{"}"foo"{"}"}, {"{"}null{"}"},{" "}
              {"{"}
              true{"}"}.{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L1043">
            Produces the following:
          </p>
          <p data-source="spec/Spec%20Additions.md#L1045">
            I can reference <var data-name="foo">foo</var>,{" "}
            <span className="spec-string">"foo"</span>,{" "}
            <span className="spec-keyword">null</span>,{" "}
            <span className="spec-keyword">true</span>.
          </p>
          <section id="sec-Value-Literals.Variables" className="subsec">
            <h6 data-source="spec/Spec%20Additions.md#L1048">
              <a
                href="#sec-Value-Literals.Variables"
                title="link to this subsection"
              >
                Variables
              </a>
            </h6>
            <p data-source="spec/Spec%20Additions.md#L1050">
              Write{" "}
              <code>
                {"{"}foo{"}"}
              </code>{" "}
              to produce a variable (represented by a &lt;var&gt; tag) like{" "}
              <var data-name="foo">foo</var>.
            </p>
          </section>
          <section id="sec-Value-Literals.Keywords" className="subsec">
            <h6 data-source="spec/Spec%20Additions.md#L1052">
              <a
                href="#sec-Value-Literals.Keywords"
                title="link to this subsection"
              >
                Keywords
              </a>
            </h6>
            <p data-source="spec/Spec%20Additions.md#L1054-L1055">
              Some known keywords like{" "}
              <span className="spec-keyword">null</span>,{" "}
              <span className="spec-keyword">undefined</span>,{" "}
              <span className="spec-keyword">true</span> and{" "}
              <span className="spec-keyword">false</span> are rendered as
              constants instead of variables.
            </p>
          </section>
          <section id="sec-Value-Literals.String-literal" className="subsec">
            <h6 data-source="spec/Spec%20Additions.md#L1057">
              <a
                href="#sec-Value-Literals.String-literal"
                title="link to this subsection"
              >
                String literal
              </a>
            </h6>
            <p data-source="spec/Spec%20Additions.md#L1059">
              Write{" "}
              <code>
                {"{"}"foo"{"}"}
              </code>{" "}
              to produce a string literal like{" "}
              <span className="spec-string">"foo"</span>.
            </p>
          </section>
          <section id="sec-Value-Literals.Grammar-tokens" className="subsec">
            <h6 data-source="spec/Spec%20Additions.md#L1061">
              <a
                href="#sec-Value-Literals.Grammar-tokens"
                title="link to this subsection"
              >
                Grammar tokens
              </a>
            </h6>
            <p data-source="spec/Spec%20Additions.md#L1063-L1066">
              Any grammar token can be written inline, like{" "}
              <code>
                {"{"}Example{"}"}
              </code>{" "}
              to represent the non-terminal token{" "}
              <span className="spec-nt">
                <a href="#Example" data-name="Example">
                  Example
                </a>
              </span>
              ,{" "}
              <code>
                {"{"}`terminal`{"}"}
              </code>{" "}
              to represent the terminal token{" "}
              <span className="spec-t">terminal</span>. Even meta tokens like{" "}
              <code>
                {"{"}[empty]{"}"}
              </code>{" "}
              for <span className="spec-empty">[empty]</span> and{" "}
              <code>
                {"{"}[lookahead !{"{"} x, y {"}"}]{"}"}
              </code>{" "}
              for{" "}
              <span className="spec-lookahead set not">
                <span className="spec-t">x</span>
                <span className="spec-t">y</span>
              </span>
              .
            </p>
          </section>
          <section id="sec-Value-Literals.Algorithm-calls" className="subsec">
            <h6 data-source="spec/Spec%20Additions.md#L1068">
              <a
                href="#sec-Value-Literals.Algorithm-calls"
                title="link to this subsection"
              >
                Algorithm calls
              </a>
            </h6>
            <p data-source="spec/Spec%20Additions.md#L1070">
              A call to an algorithm can be expressed as a value literal:
            </p>
            <pre data-source="spec/Spec%20Additions.md#L1072-L1074">
              <code>
                {"{"}Algorithm(foo, "string", null){"}"}
                {"\n"}
              </code>
            </pre>
            <p data-source="spec/Spec%20Additions.md#L1076">
              Produces the following:
            </p>
            <p data-source="spec/Spec%20Additions.md#L1078">
              <span className="spec-call">
                <a href="#Algorithm()" data-name="Algorithm">
                  Algorithm
                </a>
                (<var data-name="foo">foo</var>,{" "}
                <span className="spec-string">"string"</span>,{" "}
                <span className="spec-keyword">null</span>)
              </span>
            </p>
          </section>
        </section>
        <section id="sec-Biblio" secid="3.18">
          <h2 data-source="spec/Spec%20Additions.md#L1082">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Biblio">3.18</a>
            </span>
            Biblio
          </h2>
          <p data-source="spec/Spec%20Additions.md#L1084-L1086">
            By supplying a <code>"biblio"</code> key in a metadata file, you can
            have Algorithm calls and Non-terminal tokens which are not defined
            in this spec to link to where they are defined.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L1088-L1090">
            <code>spec-md -m metadata.json myspec.md{"\n"}</code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L1092">
            Where metadata.json includes:
          </p>
          <pre data-source="spec/Spec%20Additions.md#L1094-L1105">
            <code>
              {"{"}
              {"\n"}
              {"  "}"biblio": {"{"}
              {"\n"}
              {
                "    "
              }"http://people.mozilla.org/~jorendorff/es6-draft.html": {"{"}
              {"\n"}
              {"      "}"Identifier": "#sec-names-and-keywords",{"\n"}
              {"      "}"PrimaryExpression": "#sec-primary-expression",{"\n"}
              {"      "}"ReturnIfAbrupt()": "#sec-returnifabrupt",{"\n"}
              {"      "}"Get()": "#sec-get-o-p"{"\n"}
              {"    "}
              {"}"}
              {"\n"}
              {"  "}
              {"}"}
              {"\n"}
              {"}"}
              {"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L1107">
            Then referring to these tokens will link out to that page.
          </p>
          <pre data-source="spec/Spec%20Additions.md#L1109-L1117">
            <code>
              MemberExpression : PrimaryExpression . Identifier{"\n"}
              {"\n"}
              {"  "}* Let {"{"}reference{"}"} be the result of evaluating {"{"}
              PrimaryExpression{"}"}.{"\n"}
              {"  "}* Let {"{"}propName{"}"} be the string value of {"{"}
              Identifier
              {"}"}.{"\n"}
              {"  "}* Let {"{"}value{"}"} be {"{"}Get(reference, propName){"}"}.
              {"\n"}
              {"  "}* {"{"}ReturnIfAbrupt(value){"}"}.{"\n"}
              {"  "}* Return {"{"}value{"}"}.{"\n"}
            </code>
          </pre>
          <p data-source="spec/Spec%20Additions.md#L1119">
            Produces the following:
          </p>
          <div
            className="spec-semantic"
            data-source="spec/Spec%20Additions.md#L1121-L1128"
          >
            <span className="spec-nt">
              <span data-name="MemberExpression">MemberExpression</span>
            </span>
            <div className="spec-rhs">
              <span className="spec-nt">
                <a
                  href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-primary-expression"
                  data-name="PrimaryExpression"
                  target="_blank"
                >
                  PrimaryExpression
                </a>
              </span>
              <span className="spec-t">.</span>
              <span className="spec-nt">
                <a
                  href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-names-and-keywords"
                  data-name="Identifier"
                  target="_blank"
                >
                  Identifier
                </a>
              </span>
            </div>
            <ol>
              <li data-source="spec/Spec%20Additions.md#L1123">
                Let <var data-name="reference">reference</var> be the result of
                evaluating{" "}
                <span className="spec-nt">
                  <a
                    href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-primary-expression"
                    data-name="PrimaryExpression"
                    target="_blank"
                  >
                    PrimaryExpression
                  </a>
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1124">
                Let <var data-name="propName">propName</var> be the string value
                of{" "}
                <span className="spec-nt">
                  <a
                    href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-names-and-keywords"
                    data-name="Identifier"
                    target="_blank"
                  >
                    Identifier
                  </a>
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1125">
                Let <var data-name="value">value</var> be{" "}
                <span className="spec-call">
                  <a
                    href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-get-o-p"
                    data-name="Get"
                    target="_blank"
                  >
                    Get
                  </a>
                  (<var data-name="reference">reference</var>,{" "}
                  <var data-name="propName">propName</var>)
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1126">
                <span className="spec-call">
                  <a
                    href="http://people.mozilla.org/~jorendorff/es6-draft.html#sec-returnifabrupt"
                    data-name="ReturnIfAbrupt"
                    target="_blank"
                  >
                    ReturnIfAbrupt
                  </a>
                  (<var data-name="value">value</var>)
                </span>
                .
              </li>
              <li data-source="spec/Spec%20Additions.md#L1127-L1128">
                Return <var data-name="value">value</var>.{" "}
              </li>
            </ol>
          </div>
        </section>
      </section>
      <section id="sec-Using-Spec-Markdown" secid="A">
        <h1 data-source="spec/Usage.md#L1">
          <span className="spec-secid" title="link to this section">
            <a href="#sec-Using-Spec-Markdown">A</a>
          </span>
          Using Spec Markdown
        </h1>
        <p data-source="spec/Usage.md#L3-L5">
          If installed globally, using <code>spec-md</code> as a shell
          executable is the easiest way to use Spec Markdown. The{" "}
          <code>spec-md</code> executable expects a filepath to a Markdown
          document as input and outputs HTML on stdout. Use <code>&gt;</code> to
          write stdout to a file.
        </p>
        <pre data-language="sh" data-source="spec/Usage.md#L7-L10">
          <code>
            npm install -g spec-md{"\n"}spec-md ./path/to/markdown.md &gt;
            ./path/to/output.html{"\n"}
          </code>
        </pre>
        <p data-source="spec/Usage.md#L12-L13">
          You can also require <code>spec-md</code> as a node module, after
          which you might add the <code>spec-md</code> command as a{" "}
          <a href="https://docs.npmjs.com/cli/run-script">node script</a>.
        </p>
        <pre data-language="sh" data-source="spec/Usage.md#L15-L17">
          <code>npm install --save-dev spec-md{"\n"}</code>
        </pre>
        <pre data-language="js" data-source="spec/Usage.md#L19-L24">
          <code>
            <span className="token keyword">const</span> fs{" "}
            <span className="token operator">=</span>{" "}
            <span className="token function">require</span>
            <span className="token punctuation">(</span>
            <span className="token string">'fs'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
            <span className="token keyword">const</span> specMarkdown{" "}
            <span className="token operator">=</span>{" "}
            <span className="token function">require</span>
            <span className="token punctuation">(</span>
            <span className="token string">'spec-md'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
            <span className="token keyword">const</span> html{" "}
            <span className="token operator">=</span> specMarkdown
            <span className="token punctuation">.</span>
            <span className="token method function property-access">html</span>
            <span className="token punctuation">(</span>
            <span className="token string">'./path/to/markdown.md'</span>
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}fs<span className="token punctuation">.</span>
            <span className="token method function property-access">
              writeFileSync
            </span>
            <span className="token punctuation">(</span>
            <span className="token string">'./path/to/output.html'</span>
            <span className="token punctuation">,</span> html
            <span className="token punctuation">)</span>
            <span className="token punctuation">;</span>
            {"\n"}
          </code>
        </pre>
        <p data-source="spec/Usage.md#L26">
          The <code>spec-md</code> node module provides a few functions:
        </p>
        <ul>
          <li data-source="spec/Usage.md#L28-L29">
            <span className="spec-call">
              <span data-name="html">html</span>(
              <var data-name="filePath">filePath</var>,{" "}
              <var data-name="options">options</var>)
            </span>{" "}
            takes a <var data-name="filepath">filepath</var> to a Markdown file
            and returns an HTML string. This function is the primary usage of
            the <code>spec-md</code> module.
          </li>
          <li data-source="spec/Usage.md#L30-L32">
            <span className="spec-call">
              <span data-name="parse">parse</span>(
              <var data-name="filePath">filePath</var>)
            </span>{" "}
            takes a filepath and returns an AST <em>(Abstract Syntax Tree)</em>{" "}
            representing the contents of the Spec Markdown file, with all
            imports already inlined.
          </li>
          <li data-source="spec/Usage.md#L33-L34">
            <span className="spec-call">
              <span data-name="print">print</span>(
              <var data-name="ast">ast</var>,{" "}
              <var data-name="options">options</var>)
            </span>{" "}
            takes an <var data-name="ast">ast</var> produced by parse() and
            returns an HTML string.
          </li>
          <li data-source="spec/Usage.md#L35-L36">
            <span className="spec-call">
              <span data-name="visit">visit</span>(
              <var data-name="ast">ast</var>,{" "}
              <var data-name="visitor">visitor</var>)
            </span>{" "}
            takes an <var data-name="ast">ast</var> and a{" "}
            <var data-name="visitor">visitor</var>. It walks over the{" "}
            <var data-name="ast">ast</var> in a depth-first-traversal calling
            the <var data-name="visitor">visitor</var> along the way.
          </li>
        </ul>
        <section id="sec-Print-Options" secid="A.1">
          <h2 data-source="spec/Usage.md#L38">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Print-Options">A.1</a>
            </span>
            Print Options
          </h2>
          <p data-source="spec/Usage.md#L40-L42">
            The{" "}
            <span className="spec-call">
              <span data-name="html">html</span>(
              <var data-name="filePath">filePath</var>,{" "}
              <var data-name="options">options</var>)
            </span>{" "}
            and{" "}
            <span className="spec-call">
              <span data-name="print">print</span>(
              <var data-name="filePath">filePath</var>)
            </span>{" "}
            functions both take <var data-name="options">options</var> as an
            optional second argument. These options allow for customization
            control over the returned HTML, more options may be added in the
            future.
          </p>
          <ul>
            <li data-source="spec/Usage.md#L44-L46">
              <strong>githubSource</strong> - a base URL, that if provided will
              be used to construct Github source links to the original Markdown
              files throughout the returned HTML. (example:
              “https://github.com/leebyron/spec-md/blame/main/”)
            </li>
            <li data-source="spec/Usage.md#L48-L49">
              <strong>includeComments</strong> - If true, any HTML style
              comments that occur within the original markdown files will be
              included in the returned HTML.
            </li>
            <li data-source="spec/Usage.md#L51-L54">
              <strong>highlight</strong> - a function which is called when
              blocks of code are encountered, with the first argument as the
              string of code, the second argument being the language specified.
              This function should return well formed HTML, complete with
              escaped special characters.
            </li>
            <li data-source="spec/Usage.md#L56-L57">
              <strong>head</strong> - a string which is inserted in the{" "}
              <code>&lt;head&gt;</code> tag in the returned HTML. Use this to
              introduce additional meta tags and scripts.
            </li>
          </ul>
          <div
            id="note-ea19a"
            className="spec-note"
            data-source="spec/Usage.md#L59-L61"
          >
            <a href="#note-ea19a">Note</a>
            When using <strong>githubSource</strong> take note that normal
            Github view (eg. “blob” instead of “blame”) show rendered instead of
            source markdown and cannot link to specific lines.
          </div>
        </section>
        <section id="sec-Hot-rebuilding-with-nodemon" secid="A.2">
          <h2 data-source="spec/Usage.md#L63">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Hot-rebuilding-with-nodemon">A.2</a>
            </span>
            Hot rebuilding with nodemon
          </h2>
          <p data-source="spec/Usage.md#L65-L67">
            The <code>spec-md</code> shell executable follows the{" "}
            <a href="http://www.faqs.org/docs/artu/ch01s06.html">
              Unix Philosophy
            </a>{" "}
            of doing one thing and doing it well. Try out <code>nodemon</code>{" "}
            to continuously rebuild the HTML output as you edit the markdown
            specification:
          </p>
          <pre data-language="sh" data-source="spec/Usage.md#L69-L72">
            <code>
              npm install -g nodemon{"\n"}nodemon --exec "spec-md &gt;
              ./path/to/output.html" ./path/to/markdown.md{"\n"}
            </code>
          </pre>
        </section>
      </section>
      <section id="sec-Contributing-to-Spec-Markdown" secid="B">
        <h1 data-source="CONTRIBUTING.md#L1">
          <span className="spec-secid" title="link to this section">
            <a href="#sec-Contributing-to-Spec-Markdown">B</a>
          </span>
          Contributing to Spec Markdown
        </h1>
        <p data-source="CONTRIBUTING.md#L3-L6">
          We want to make contributing to this project as easy and transparent
          as possible. Hopefully this document makes the process for
          contributing clear and answers any questions you may have. If not,
          feel free to open an{" "}
          <a href="https://github.com/leebyron/spec-md/issues">Issue</a>.
        </p>
        <section id="sec-Pull-Requests" secid="B.1">
          <h2 data-source="CONTRIBUTING.md#L8">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Pull-Requests">B.1</a>
            </span>
            Pull Requests
          </h2>
          <p data-source="CONTRIBUTING.md#L10-L11">
            All active development of Spec Markdown happens on GitHub. We
            actively welcome your{" "}
            <a href="https://help.github.com/articles/creating-a-pull-request">
              pull requests
            </a>
            .
          </p>
          <ol>
            <li data-source="CONTRIBUTING.md#L13-L14">
              <a href="https://github.com/leebyron/spec-md/">Fork the repo</a>{" "}
              and create your branch from <code>main</code>.
            </li>
            <li data-source="CONTRIBUTING.md#L15">
              Install all dependencies. (<code>npm install</code>)
            </li>
            <li data-source="CONTRIBUTING.md#L16">
              If you’ve added code, add tests.
            </li>
            <li data-source="CONTRIBUTING.md#L17">
              If you’ve changed APIs, update the documentation.
            </li>
            <li data-source="CONTRIBUTING.md#L18">
              Run tests and ensure your code passes lint. (<code>npm test</code>
              )
            </li>
          </ol>
        </section>
        <section id="sec--main-is-unsafe" secid="B.2">
          <h2 data-source="CONTRIBUTING.md#L20">
            <span className="spec-secid" title="link to this section">
              <a href="#sec--main-is-unsafe">B.2</a>
            </span>
            `main` is unsafe
          </h2>
          <p data-source="CONTRIBUTING.md#L22-L27">
            We will do our best to keep <code>main</code> in good shape, with
            tests passing at all times. But in order to move fast, we might make
            API changes that your application might not be compatible with. We
            will do our best to communicate these changes and always{" "}
            <a href="http://semver.org/">version</a> appropriately so you can
            lock into a specific version if need be. If any of this is worrysome
            to you, just use{" "}
            <a href="https://www.npmjs.org/package/spec-md">npm</a>.
          </p>
        </section>
        <section id="sec-Issues" secid="B.3">
          <h2 data-source="CONTRIBUTING.md#L29">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Issues">B.3</a>
            </span>
            Issues
          </h2>
          <p data-source="CONTRIBUTING.md#L31-L33">
            We use GitHub issues to track public bugs and requests. Please
            ensure your bug description is clear and has sufficient instructions
            to be able to reproduce the issue. The best way is to provide a
            reduced test case on jsFiddle or jsBin.
          </p>
        </section>
        <section id="sec-Coding-Style" secid="B.4">
          <h2 data-source="CONTRIBUTING.md#L35">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-Coding-Style">B.4</a>
            </span>
            Coding Style
          </h2>
          <ul>
            <li data-source="CONTRIBUTING.md#L37">
              2 spaces for indentation (no tabs)
            </li>
            <li data-source="CONTRIBUTING.md#L38">
              80 character line length strongly preferred.
            </li>
            <li data-source="CONTRIBUTING.md#L39">
              Prefer <code>'</code> over <code>"</code>
            </li>
            <li data-source="CONTRIBUTING.md#L40">Use semicolons;</li>
            <li data-source="CONTRIBUTING.md#L41">Trailing commas,</li>
            <li data-source="CONTRIBUTING.md#L42">Avd abbr wrds.</li>
          </ul>
        </section>
        <section id="sec-License" secid="B.5">
          <h2 data-source="CONTRIBUTING.md#L44">
            <span className="spec-secid" title="link to this section">
              <a href="#sec-License">B.5</a>
            </span>
            License
          </h2>
          <p data-source="CONTRIBUTING.md#L46-L48">
            By contributing to Spec Markdown, you agree that your contributions
            will be licensed under its MIT license.{" "}
          </p>
        </section>
      </section>
      <section id="index" secid="index" className="spec-index">
        <h1>
          <span className="spec-secid" title="link to the index">
            <a href="#index">§</a>
          </span>
          Index
        </h1>
        <ol>
          <li>
            <a href="#Algorithm()">Algorithm</a>
          </li>
          <li>
            <a href="#AssignmentOperator">AssignmentOperator</a>
          </li>
          <li>
            <a href="#BalancedParens">BalancedParens</a>
          </li>
          <li>
            <a href="#Book">Book</a>
          </li>
          <li>
            <a href="#cookie">Cookie</a>
          </li>
          <li>
            <a href="#DivisionExpression">DivisionExpression</a>
          </li>
          <li>
            <a href="#Example">Example</a>
          </li>
          <li>
            <a href="#Example_P">Example_P</a>
          </li>
          <li>
            <a href="#Example_P_Q">Example_P_Q</a>
          </li>
          <li>
            <a href="#Example_Q">Example_Q</a>
          </li>
          <li>
            <a href="#Example_WithCondition">Example_WithCondition</a>
          </li>
          <li>
            <a href="#Keyword">Keyword</a>
          </li>
          <li>
            <a href="#Page_list">Page_list</a>
          </li>
          <li>
            <a href="#PBJ">PBJ</a>
          </li>
          <li>
            <a href="#philosophy">Philosophy</a>
          </li>
          <li>
            <a href="#Sandwich">Sandwich</a>
          </li>
          <li>
            <a href="#Sentence">Sentence</a>
          </li>
          <li>
            <a href="#Topping_list">Topping_list</a>
          </li>
          <li>
            <a href="#TypeOne">TypeOne</a>
          </li>
          <li>
            <a href="#TypeThree">TypeThree</a>
          </li>
          <li>
            <a href="#TypeTwo">TypeTwo</a>
          </li>
          <li>
            <a href="#UnionMembers">UnionMembers</a>
          </li>
          <li>
            <a href="#UppercaseWord">UppercaseWord</a>
          </li>
          <li>
            <a href="#WhileStatement">WhileStatement</a>
          </li>
        </ol>
      </section>
    </article>
  );
}
function Sidebar() {
  return (
    <div className="spec-sidebar" aria-hidden="">
      <div className="spec-toc">
        <div className="title">
          <a href="#">Spec Markdown</a>
        </div>
        <ol>
          <li id="_sidebar_1" className="">
            <a href="#sec-Getting-Started">
              <span className="spec-secid">1</span>Getting Started
            </a>
          </li>
          <li id="_sidebar_2" className="">
            <a href="#sec-Markdown">
              <span className="spec-secid">2</span>Markdown
            </a>
            <input
              hidden=""
              className="toggle"
              type="checkbox"
              id="_toggle_2"
            />
            <label htmlFor="_toggle_2" />
            <ol>
              <li id="_sidebar_2.1" className="">
                <a href="#sec-Character-Encoding">
                  <span className="spec-secid">2.1</span>Character Encoding
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_2.1"
                />
                <label htmlFor="_toggle_2.1" />
                <ol>
                  <li id="_sidebar_2.1.1" className="">
                    <a href="#sec-Escape-sequence">
                      <span className="spec-secid">2.1.1</span>Escape sequence
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_2.2" className="">
                <a href="#sec-Inline-formatting">
                  <span className="spec-secid">2.2</span>Inline formatting
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_2.2"
                />
                <label htmlFor="_toggle_2.2" />
                <ol>
                  <li id="_sidebar_2.2.1" className="">
                    <a href="#sec-Inline-HTML">
                      <span className="spec-secid">2.2.1</span>Inline HTML
                    </a>
                  </li>
                  <li id="_sidebar_2.2.2" className="">
                    <a href="#sec-Links">
                      <span className="spec-secid">2.2.2</span>Links
                    </a>
                  </li>
                  <li id="_sidebar_2.2.3" className="">
                    <a href="#sec-Emphasis">
                      <span className="spec-secid">2.2.3</span>Emphasis
                    </a>
                  </li>
                  <li id="_sidebar_2.2.4" className="">
                    <a href="#sec-Inline-Code">
                      <span className="spec-secid">2.2.4</span>Inline Code
                    </a>
                  </li>
                  <li id="_sidebar_2.2.5" className="">
                    <a href="#sec-Images">
                      <span className="spec-secid">2.2.5</span>Images
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_2.3" className="">
                <a href="#sec-Blocks">
                  <span className="spec-secid">2.3</span>Blocks
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_2.3"
                />
                <label htmlFor="_toggle_2.3" />
                <ol>
                  <li id="_sidebar_2.3.1" className="">
                    <a href="#sec-Block-HTML">
                      <span className="spec-secid">2.3.1</span>Block HTML
                    </a>
                  </li>
                  <li id="_sidebar_2.3.2" className="">
                    <a href="#sec-Blocks.Section-Headers">
                      <span className="spec-secid">2.3.2</span>Section Headers
                    </a>
                  </li>
                  <li id="_sidebar_2.3.3" className="">
                    <a href="#sec-Paragraphs">
                      <span className="spec-secid">2.3.3</span>Paragraphs
                    </a>
                  </li>
                  <li id="_sidebar_2.3.4" className="">
                    <a href="#sec-Lists">
                      <span className="spec-secid">2.3.4</span>Lists
                    </a>
                    <input
                      hidden=""
                      className="toggle"
                      type="checkbox"
                      id="_toggle_2.3.4"
                    />
                    <label htmlFor="_toggle_2.3.4" />
                    <ol>
                      <li id="_sidebar_2.3.4.1" className="">
                        <a href="#sec-Task-Lists">
                          <span className="spec-secid">2.3.4.1</span>Task Lists
                        </a>
                      </li>
                    </ol>
                  </li>
                  <li id="_sidebar_2.3.5" className="">
                    <a href="#sec-Code-Block">
                      <span className="spec-secid">2.3.5</span>Code Block
                    </a>
                  </li>
                  <li id="_sidebar_2.3.6" className="">
                    <a href="#sec-Block-Quotes">
                      <span className="spec-secid">2.3.6</span>Block Quotes
                    </a>
                  </li>
                  <li id="_sidebar_2.3.7" className="">
                    <a href="#sec-Horizontal-Rules">
                      <span className="spec-secid">2.3.7</span>Horizontal Rules
                    </a>
                  </li>
                  <li id="_sidebar_2.3.8" className="">
                    <a href="#sec-Automatic-Links">
                      <span className="spec-secid">2.3.8</span>Automatic Links
                    </a>
                  </li>
                </ol>
              </li>
            </ol>
          </li>
          <li id="_sidebar_3" className="">
            <a href="#sec-Spec-Additions">
              <span className="spec-secid">3</span>Spec Additions
            </a>
            <input
              hidden=""
              className="toggle"
              type="checkbox"
              id="_toggle_3"
            />
            <label htmlFor="_toggle_3" />
            <ol>
              <li id="_sidebar_3.1" className="">
                <a href="#sec-Link-Anything">
                  <span className="spec-secid">3.1</span>Link Anything
                </a>
              </li>
              <li id="_sidebar_3.2" className="">
                <a href="#sec-Title-and-Introduction">
                  <span className="spec-secid">3.2</span>Title and Introduction
                </a>
              </li>
              <li id="_sidebar_3.3" className="">
                <a href="#sec-Sections">
                  <span className="spec-secid">3.3</span>Sections
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_3.3"
                />
                <label htmlFor="_toggle_3.3" />
                <ol>
                  <li id="_sidebar_3.3.1" className="">
                    <a href="#sec-Sections.Section-Headers">
                      <span className="spec-secid">3.3.1</span>Section Headers
                    </a>
                  </li>
                  <li id="_sidebar_3.3.2" className="">
                    <a href="#sec-Subsection-Headers">
                      <span className="spec-secid">3.3.2</span>Subsection
                      Headers
                    </a>
                  </li>
                  <li id="_sidebar_3.3.3" className="">
                    <a href="#sec-Table-of-Contents">
                      <span className="spec-secid">3.3.3</span>Table of Contents
                    </a>
                  </li>
                  <li id="_sidebar_3.3.4" className="">
                    <a href="#sec-Section-Numbers">
                      <span className="spec-secid">3.3.4</span>Section Numbers
                    </a>
                    <input
                      hidden=""
                      className="toggle"
                      type="checkbox"
                      id="_toggle_3.3.4"
                    />
                    <label htmlFor="_toggle_3.3.4" />
                    <ol>
                      <li id="_sidebar_3.3.4.8" className="">
                        <a href="#sec-Custom-Numbers">
                          <span className="spec-secid">3.3.4.8</span>Custom
                          Numbers
                        </a>
                      </li>
                      <li id="_sidebar_3.3.4.9" className="">
                        <a href="#sec-Appendix-Annex-Sections">
                          <span className="spec-secid">3.3.4.9</span>Appendix /
                          Annex Sections
                        </a>
                      </li>
                    </ol>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_3.4" className="">
                <a href="#sec-Smart-Characters">
                  <span className="spec-secid">3.4</span>Smart Characters
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_3.4"
                />
                <label htmlFor="_toggle_3.4" />
                <ol>
                  <li id="_sidebar_3.4.1" className="">
                    <a href="#sec-Quotes-and-Dashes">
                      <span className="spec-secid">3.4.1</span>Quotes and Dashes
                    </a>
                  </li>
                  <li id="_sidebar_3.4.2" className="">
                    <a href="#sec-Math">
                      <span className="spec-secid">3.4.2</span>Math
                    </a>
                  </li>
                  <li id="_sidebar_3.4.3" className="">
                    <a href="#sec-Arrows">
                      <span className="spec-secid">3.4.3</span>Arrows
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_3.5" className="">
                <a href="#sec-Tables">
                  <span className="spec-secid">3.5</span>Tables
                </a>
              </li>
              <li id="_sidebar_3.6" className="">
                <a href="#sec-Comments">
                  <span className="spec-secid">3.6</span>Comments
                </a>
              </li>
              <li id="_sidebar_3.7" className="">
                <a href="#sec-Definitions">
                  <span className="spec-secid">3.7</span>Definitions
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_3.7"
                />
                <label htmlFor="_toggle_3.7" />
                <ol>
                  <li id="_sidebar_3.7.1" className="">
                    <a href="#sec-Definition-List">
                      <span className="spec-secid">3.7.1</span>Definition List
                    </a>
                  </li>
                  <li id="_sidebar_3.7.2" className="">
                    <a href="#sec-Definition-Paragraph">
                      <span className="spec-secid">3.7.2</span>Definition
                      Paragraph
                    </a>
                  </li>
                  <li id="_sidebar_3.7.3" className="">
                    <a href="#sec-Definition-References">
                      <span className="spec-secid">3.7.3</span>Definition
                      References
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_3.8" className="">
                <a href="#sec-Note">
                  <span className="spec-secid">3.8</span>Note
                </a>
              </li>
              <li id="_sidebar_3.9" className="">
                <a href="#sec-Todo">
                  <span className="spec-secid">3.9</span>Todo
                </a>
              </li>
              <li id="_sidebar_3.10" className="">
                <a href="#sec-Syntax-Highlighting">
                  <span className="spec-secid">3.10</span>Syntax Highlighting
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_3.10"
                />
                <label htmlFor="_toggle_3.10" />
                <ol>
                  <li id="_sidebar_3.10.1" className="">
                    <a href="#sec-Examples">
                      <span className="spec-secid">3.10.1</span>Examples
                    </a>
                  </li>
                  <li id="_sidebar_3.10.2" className="">
                    <a href="#sec-Counter-Examples">
                      <span className="spec-secid">3.10.2</span>Counter Examples
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_3.11" className="">
                <a href="#sec-Imports">
                  <span className="spec-secid">3.11</span>Imports
                </a>
              </li>
              <li id="_sidebar_3.12" className="">
                <a href="#sec-Inline-editing">
                  <span className="spec-secid">3.12</span>Inline editing
                </a>
              </li>
              <li id="_sidebar_3.13" className="">
                <a href="#sec-Block-editing">
                  <span className="spec-secid">3.13</span>Block editing
                </a>
              </li>
              <li id="_sidebar_3.14" className="">
                <a href="#sec-Algorithms">
                  <span className="spec-secid">3.14</span>Algorithms
                </a>
              </li>
              <li id="_sidebar_3.15" className="">
                <a href="#sec-Grammar">
                  <span className="spec-secid">3.15</span>Grammar
                </a>
                <input
                  hidden=""
                  className="toggle"
                  type="checkbox"
                  id="_toggle_3.15"
                />
                <label htmlFor="_toggle_3.15" />
                <ol>
                  <li id="_sidebar_3.15.1" className="">
                    <a href="#sec-Grammar-Production">
                      <span className="spec-secid">3.15.1</span>Grammar
                      Production
                    </a>
                  </li>
                  <li id="_sidebar_3.15.2" className="">
                    <a href="#sec-Production-types">
                      <span className="spec-secid">3.15.2</span>Production types
                    </a>
                  </li>
                  <li id="_sidebar_3.15.3" className="">
                    <a href="#sec-One-of">
                      <span className="spec-secid">3.15.3</span>One of
                    </a>
                  </li>
                  <li id="_sidebar_3.15.4">
                    <a href="#sec-Non-Terminal-Token">
                      <span className="spec-secid">3.15.4</span>Non Terminal
                      Token
                    </a>
                  </li>
                  <li id="_sidebar_3.15.5" className="">
                    <a href="#sec-Prose">
                      <span className="spec-secid">3.15.5</span>Prose
                    </a>
                  </li>
                  <li id="_sidebar_3.15.6" className="">
                    <a href="#sec-Terminal-Token">
                      <span className="spec-secid">3.15.6</span>Terminal Token
                    </a>
                  </li>
                  <li id="_sidebar_3.15.7" className="">
                    <a href="#sec-Regular-Expression">
                      <span className="spec-secid">3.15.7</span>Regular
                      Expression
                    </a>
                  </li>
                  <li id="_sidebar_3.15.8" className="">
                    <a href="#sec-Quantifiers">
                      <span className="spec-secid">3.15.8</span>Quantifiers
                    </a>
                  </li>
                  <li id="_sidebar_3.15.9" className="">
                    <a href="#sec-Conditional-Parameters">
                      <span className="spec-secid">3.15.9</span>Conditional
                      Parameters
                    </a>
                  </li>
                  <li id="_sidebar_3.15.10" className="">
                    <a href="#sec-Constraints">
                      <span className="spec-secid">3.15.10</span>Constraints
                    </a>
                  </li>
                  <li id="_sidebar_3.15.11" className="">
                    <a href="#sec-Meta-Tokens">
                      <span className="spec-secid">3.15.11</span>Meta Tokens
                    </a>
                  </li>
                </ol>
              </li>
              <li id="_sidebar_3.16" className="">
                <a href="#sec-Grammar-Semantics">
                  <span className="spec-secid">3.16</span>Grammar Semantics
                </a>
              </li>
              <li id="_sidebar_3.17" className="">
                <a href="#sec-Value-Literals">
                  <span className="spec-secid">3.17</span>Value Literals
                </a>
              </li>
              <li id="_sidebar_3.18" className="">
                <a href="#sec-Biblio">
                  <span className="spec-secid">3.18</span>Biblio
                </a>
              </li>
            </ol>
          </li>
          <li id="_sidebar_A" className="">
            <a href="#sec-Using-Spec-Markdown">
              <span className="spec-secid">A</span>Using Spec Markdown
            </a>
            <input
              hidden=""
              className="toggle"
              type="checkbox"
              id="_toggle_A"
            />
            <label htmlFor="_toggle_A" />
            <ol>
              <li id="_sidebar_A.1" className="">
                <a href="#sec-Print-Options">
                  <span className="spec-secid">A.1</span>Print Options
                </a>
              </li>
              <li id="_sidebar_A.2" className="">
                <a href="#sec-Hot-rebuilding-with-nodemon">
                  <span className="spec-secid">A.2</span>Hot rebuilding with
                  nodemon
                </a>
              </li>
            </ol>
          </li>
          <li id="_sidebar_B" className="">
            <a href="#sec-Contributing-to-Spec-Markdown">
              <span className="spec-secid">B</span>Contributing to Spec Markdown
            </a>
            <input
              hidden=""
              className="toggle"
              type="checkbox"
              id="_toggle_B"
            />
            <label htmlFor="_toggle_B" />
            <ol>
              <li id="_sidebar_B.1" className="">
                <a href="#sec-Pull-Requests">
                  <span className="spec-secid">B.1</span>Pull Requests
                </a>
              </li>
              <li id="_sidebar_B.2" className="">
                <a href="#sec--main-is-unsafe">
                  <span className="spec-secid">B.2</span>`main` is unsafe
                </a>
              </li>
              <li id="_sidebar_B.3" className="">
                <a href="#sec-Issues">
                  <span className="spec-secid">B.3</span>Issues
                </a>
              </li>
              <li id="_sidebar_B.4" className="">
                <a href="#sec-Coding-Style">
                  <span className="spec-secid">B.4</span>Coding Style
                </a>
              </li>
              <li id="_sidebar_B.5" className="">
                <a href="#sec-License">
                  <span className="spec-secid">B.5</span>License
                </a>
              </li>
            </ol>
          </li>
          <li id="_sidebar_index">
            <a href="#index">
              <span className="spec-secid">§</span>Index
            </a>
          </li>
        </ol>
      </div>
    </div>
  );
}
