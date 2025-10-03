# @xyd-js/ask-ai

A modular AI chat component library with support for multiple frameworks and environments.

## Installation

```bash
npm install @xyd-js/ask-ai
```

## Usage

### Core Components
```typescript
import { AskAI, AskAIMessage } from '@xyd-js/ask-ai';
// or explicitly
import { AskAI, AskAIMessage } from '@xyd-js/ask-ai/components';
```

### React Integration
```typescript
import { AskAI, useAskAI } from '@xyd-js/ask-ai/react';
```

### Node.js Server
```typescript
import { askPrompt } from '@xyd-js/ask-ai/node';
```

## Package Structure

This package provides four main entry points:

### 📦 Core Components (`@xyd-js/ask-ai` or `@xyd-js/ask-ai/components`)
Core Lit-based web components for the AI chat interface.

**Exports:**
- `AskAI` - Main chat component
- `AskAIMessage` - Individual message component

### 📦 React Integration (`@xyd-js/ask-ai/react`)
React wrapper components using @lit/react.

**Exports:**
- `AskAI` - React component wrapper
- `useAskAI()` - React hook for state management

### 📦 Node.js Server (`@xyd-js/ask-ai/node`)
Node.js server utilities for AI integration.

**Exports:**
- `askPrompt()` - Server-side AI prompt handling

## Development

### Build
```bash
npm run build
```

### Demo
The `demo/` directory contains a working example using Vite.

```bash
# Run the demo
npm run dev:demo

# Build the demo
npm run build:demo
```

## Architecture

- **Components**: Lit-based web components with CSS-in-JS styling
- **Node**: Server-side utilities for AI integration
- **React**: React wrappers using @lit/react for seamless integration
- **Build**: Single rollup-based build system with TypeScript support
