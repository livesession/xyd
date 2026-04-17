# Editor Features

Five view modes for documentation editing.

## View Modes

| Mode | Description |
|------|-------------|
| Code | Monaco Editor with syntax highlighting |
| Render | Live preview of compiled Markdown |
| Navigation | Visual documentation structure builder (upsell) |
| Site | Local xyd dev server in iframe |
| Diff | Side-by-side comparison via @git-diff-view |

## Code Editor

Auto language detection: .json→JSON, .yaml→YAML, .ts/.tsx→TypeScript, .md/.mdx→Markdown.

## Visual Editor

Main process compiles markdown via remark/rehype/recma. Renderer executes compiled code with React primitives.

## Site Preview

Spawns xyd dev server as child process. Port detected from stdout. 5-second status polling.

## Diff View

Compares working copy vs remote base. Auto-selects first modified file.

## Publishing

Creates Git commits via GitHub Git Data API: fetch commit SHA, create blobs, build tree, create commit, update branch pointer.
