"use strict";
const {Fragment: $Fragment, jsx: $jsx, jsxs: $jsxs} = arguments[0];
const toc = [];
const frontmatter = {
  "title": "OpenAPI reference",
  "openapi": "./api.yaml"
};
function $createMdxContent(props) {
  const $components = {
    p: "p",
    ...props.components
  }, {Atlas} = $components;
  if (!Atlas) $missingMdxReference("Atlas", true);
  return $jsx(Atlas, {
    references: [{
      __UNSAFE_selector: function noRefCheck() {},
      canonical: 'ping-the-server',
      category: 'rest',
      context: {
        group: [''],
        method: 'get',
        path: '/ping',
        scopes: []
      },
      definitions: [{
        properties: [],
        title: 'Response',
        type: 'return',
        variants: [{
          description: 'OK',
          meta: [{
            name: 'status',
            value: '200'
          }, {
            name: 'contentType',
            value: 'application/json'
          }, {
            name: 'definitionDescription',
            value: ''
          }],
          properties: [{
            description: '',
            meta: [],
            name: 'pong',
            type: 'boolean'
          }],
          title: '200'
        }]
      }],
      description: $jsxs($Fragment, {
        children: [$jsx($components.p, {
          children: "Ping the server"
        }), $jsx($components.p, {
          children: "Hand-written prose composed with the auto-generated API reference above."
        })]
      }),
      examples: {
        groups: [{
          description: 'Example request',
          examples: [{
            codeblock: {
              tabs: [{
                code: 'curl --request GET \\\n     --url https://example.com/ping \\\n     --header \'accept: application/json\'',
                highlighted: {
                  annotations: [],
                  code: 'curl --request GET \\\n     --url https://example.com/ping \\\n     --header \'accept: application/json\'',
                  lang: 'shellscript',
                  meta: 'shell',
                  style: {
                    background: '#0d1117',
                    color: '#c9d1d9',
                    colorScheme: 'dark'
                  },
                  themeName: 'github-dark',
                  tokens: [['curl', '#FFA657'], ' ', ['--request', '#79C0FF'], ' ', ['GET', '#A5D6FF'], ' ', ['\\', '#79C0FF'], '\n     ', ['--url', '#79C0FF'], ' ', ['https://example.com/ping', '#A5D6FF'], ' ', ['\\', '#79C0FF'], '\n     ', ['--header', '#79C0FF'], ' ', ['\'accept: application/json\'', '#A5D6FF']],
                  value: 'curl --request GET \\\n     --url https://example.com/ping \\\n     --header \'accept: application/json\''
                },
                language: 'shell',
                title: 'shell'
              }, {
                code: 'const options = {method: \'GET\', headers: {accept: \'application/json\'}};\n\nfetch(\'https://example.com/ping\', options)\n  .then(res => res.json())\n  .then(res => console.log(res))\n  .catch(err => console.error(err));',
                highlighted: {
                  annotations: [],
                  code: 'const options = {method: \'GET\', headers: {accept: \'application/json\'}};\n\nfetch(\'https://example.com/ping\', options)\n  .then(res => res.json())\n  .then(res => console.log(res))\n  .catch(err => console.error(err));',
                  lang: 'javascript',
                  meta: 'javascript',
                  style: {
                    background: '#0d1117',
                    color: '#c9d1d9',
                    colorScheme: 'dark'
                  },
                  themeName: 'github-dark',
                  tokens: [['const', '#FF7B72'], ' ', ['options', '#79C0FF'], ' ', ['=', '#FF7B72'], ' ', ['{method:', '#C9D1D9'], ' ', ['\'GET\'', '#A5D6FF'], [', headers: {accept:', '#C9D1D9'], ' ', ['\'application/json\'', '#A5D6FF'], ['}};', '#C9D1D9'], '\n\n', ['fetch', '#D2A8FF'], ['(', '#C9D1D9'], ['\'https://example.com/ping\'', '#A5D6FF'], [', options)', '#C9D1D9'], '\n  ', ['.', '#C9D1D9'], ['then', '#D2A8FF'], ['(', '#C9D1D9'], ['res', '#FFA657'], ' ', ['=>', '#FF7B72'], ' ', ['res.', '#C9D1D9'], ['json', '#D2A8FF'], ['())', '#C9D1D9'], '\n  ', ['.', '#C9D1D9'], ['then', '#D2A8FF'], ['(', '#C9D1D9'], ['res', '#FFA657'], ' ', ['=>', '#FF7B72'], ' ', ['console.', '#C9D1D9'], ['log', '#D2A8FF'], ['(res))', '#C9D1D9'], '\n  ', ['.', '#C9D1D9'], ['catch', '#D2A8FF'], ['(', '#C9D1D9'], ['err', '#FFA657'], ' ', ['=>', '#FF7B72'], ' ', ['console.', '#C9D1D9'], ['error', '#D2A8FF'], ['(err));', '#C9D1D9']],
                  value: 'const options = {method: \'GET\', headers: {accept: \'application/json\'}};\n\nfetch(\'https://example.com/ping\', options)\n  .then(res => res.json())\n  .then(res => console.log(res))\n  .catch(err => console.error(err));'
                },
                language: 'javascript',
                title: 'javascript'
              }, {
                code: 'import requests\n\nurl = "https://example.com/ping"\n\nheaders = {"accept": "application/json"}\n\nresponse = requests.get(url, headers=headers)\n\nprint(response.text)',
                highlighted: {
                  annotations: [],
                  code: 'import requests\n\nurl = "https://example.com/ping"\n\nheaders = {"accept": "application/json"}\n\nresponse = requests.get(url, headers=headers)\n\nprint(response.text)',
                  lang: 'python',
                  meta: 'python',
                  style: {
                    background: '#0d1117',
                    color: '#c9d1d9',
                    colorScheme: 'dark'
                  },
                  themeName: 'github-dark',
                  tokens: [['import', '#FF7B72'], ' ', ['requests', '#C9D1D9'], '\n\n', ['url', '#C9D1D9'], ' ', ['=', '#FF7B72'], ' ', ['"https://example.com/ping"', '#A5D6FF'], '\n\n', ['headers', '#C9D1D9'], ' ', ['=', '#FF7B72'], ' ', ['{', '#C9D1D9'], ['"accept"', '#A5D6FF'], [':', '#C9D1D9'], ' ', ['"application/json"', '#A5D6FF'], ['}', '#C9D1D9'], '\n\n', ['response', '#C9D1D9'], ' ', ['=', '#FF7B72'], ' ', ['requests.get(url,', '#C9D1D9'], ' ', ['headers', '#FFA657'], ['=', '#FF7B72'], ['headers)', '#C9D1D9'], '\n\n', ['print', '#79C0FF'], ['(response.text)', '#C9D1D9']],
                  value: 'import requests\n\nurl = "https://example.com/ping"\n\nheaders = {"accept": "application/json"}\n\nresponse = requests.get(url, headers=headers)\n\nprint(response.text)'
                },
                language: 'python',
                title: 'python'
              }, {
                code: 'package main\n\nimport (\n  "fmt"\n  "net/http"\n  "io"\n)\n\nfunc main() {\n\n  url := "https://example.com/ping"\n\n  req, _ := http.NewRequest("GET", url, nil)\n\n  req.Header.Add("accept", "application/json")\n\n  res, _ := http.DefaultClient.Do(req)\n\n  defer res.Body.Close()\n  body, _ := io.ReadAll(res.Body)\n\n  fmt.Println(string(body))\n\n}',
                highlighted: {
                  annotations: [],
                  code: 'package main\n\nimport (\n  "fmt"\n  "net/http"\n  "io"\n)\n\nfunc main() {\n\n  url := "https://example.com/ping"\n\n  req, _ := http.NewRequest("GET", url, nil)\n\n  req.Header.Add("accept", "application/json")\n\n  res, _ := http.DefaultClient.Do(req)\n\n  defer res.Body.Close()\n  body, _ := io.ReadAll(res.Body)\n\n  fmt.Println(string(body))\n\n}',
                  lang: 'go',
                  meta: 'go',
                  style: {
                    background: '#0d1117',
                    color: '#c9d1d9',
                    colorScheme: 'dark'
                  },
                  themeName: 'github-dark',
                  tokens: [['package', '#FF7B72'], ' ', ['main', '#FFA657'], '\n\n', ['import', '#FF7B72'], ' ', ['(', '#C9D1D9'], '\n  ', ['"', '#A5D6FF'], ['fmt', '#FFA657'], ['"', '#A5D6FF'], '\n  ', ['"', '#A5D6FF'], ['net/http', '#FFA657'], ['"', '#A5D6FF'], '\n  ', ['"', '#A5D6FF'], ['io', '#FFA657'], ['"', '#A5D6FF'], '\n', [')', '#C9D1D9'], '\n\n', ['func', '#FF7B72'], ' ', ['main', '#D2A8FF'], ['() {', '#C9D1D9'], '\n\n  ', ['url', '#C9D1D9'], ' ', [':=', '#FF7B72'], ' ', ['"https://example.com/ping"', '#A5D6FF'], '\n\n  ', ['req, _', '#C9D1D9'], ' ', [':=', '#FF7B72'], ' ', ['http.', '#C9D1D9'], ['NewRequest', '#D2A8FF'], ['(', '#C9D1D9'], ['"GET"', '#A5D6FF'], [', url,', '#C9D1D9'], ' ', ['nil', '#79C0FF'], [')', '#C9D1D9'], '\n\n  ', ['req.Header.', '#C9D1D9'], ['Add', '#D2A8FF'], ['(', '#C9D1D9'], ['"accept"', '#A5D6FF'], [',', '#C9D1D9'], ' ', ['"application/json"', '#A5D6FF'], [')', '#C9D1D9'], '\n\n  ', ['res, _', '#C9D1D9'], ' ', [':=', '#FF7B72'], ' ', ['http.DefaultClient.', '#C9D1D9'], ['Do', '#D2A8FF'], ['(req)', '#C9D1D9'], '\n\n  ', ['defer', '#FF7B72'], ' ', ['res.Body.', '#C9D1D9'], ['Close', '#D2A8FF'], ['()', '#C9D1D9'], '\n  ', ['body, _', '#C9D1D9'], ' ', [':=', '#FF7B72'], ' ', ['io.', '#C9D1D9'], ['ReadAll', '#D2A8FF'], ['(res.Body)', '#C9D1D9'], '\n\n  ', ['fmt.', '#C9D1D9'], ['Println', '#D2A8FF'], ['(', '#C9D1D9'], ['string', '#FF7B72'], ['(body))', '#C9D1D9'], '\n\n', ['}', '#C9D1D9']],
                  value: 'package main\n\nimport (\n  "fmt"\n  "net/http"\n  "io"\n)\n\nfunc main() {\n\n  url := "https://example.com/ping"\n\n  req, _ := http.NewRequest("GET", url, nil)\n\n  req.Header.Add("accept", "application/json")\n\n  res, _ := http.DefaultClient.Do(req)\n\n  defer res.Body.Close()\n  body, _ := io.ReadAll(res.Body)\n\n  fmt.Println(string(body))\n\n}'
                },
                language: 'go',
                title: 'go'
              }]
            }
          }],
          kind: 'request'
        }, {
          description: 'Example response',
          examples: [{
            codeblock: {
              tabs: [{
                code: '{\n  "pong": true\n}',
                highlighted: {
                  annotations: [],
                  code: '{\n  "pong": true\n}',
                  lang: 'json',
                  meta: 'application/json',
                  style: {
                    background: '#0d1117',
                    color: '#c9d1d9',
                    colorScheme: 'dark'
                  },
                  themeName: 'github-dark',
                  tokens: [['{', '#C9D1D9'], '\n  ', ['"pong"', '#7EE787'], [':', '#C9D1D9'], ' ', ['true', '#79C0FF'], '\n', ['}', '#C9D1D9']],
                  value: '{\n  "pong": true\n}'
                },
                language: 'json',
                title: 'application/json'
              }],
              title: '200'
            }
          }],
          kind: 'response'
        }]
      },
      title: 'Ping the server',
      type: 'rest_get'
    }]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? $jsx(MDXLayout, {
    ...props,
    children: $jsx($createMdxContent, {
      ...props
    })
  }) : $createMdxContent(props);
}
return {
  toc,
  frontmatter,
  default: MDXContent
};
function $missingMdxReference(id, component) {
  throw new Error("Expected " + (component ? "component" : "object") + " `" + id + "` to be defined: you likely forgot to import, pass, or provide it.");
}
