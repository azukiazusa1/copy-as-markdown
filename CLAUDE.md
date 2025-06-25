# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension built with TypeScript that extracts article content from web pages and converts it to Markdown format. The extension uses Chrome's Manifest V3 with a content script architecture for HTML extraction and a popup interface for user interaction.

## Development Commands

### Build and Development
- `npm run build` - Full production build (clean → lint → typecheck → format → compile → package as ZIP)
- `npm run dev` - Development mode with TypeScript watch
- `npm run clean` - Remove dist/ directory

### Code Quality
- `npm run typecheck` - TypeScript type checking without compilation
- `npm run lint` - Run oxlint on src/ directory
- `npm run lint:fix` - Run oxlint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

### Testing
- `npm run test` - Interactive test mode with Vitest
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Open Vitest UI in browser

## Architecture

### Core Components
1. **Content Script** (`src/content.ts`): Injected into web pages to extract HTML content and convert to Markdown
2. **Popup** (`src/popup.ts`): Extension UI that handles user interaction and clipboard operations
3. **MarkdownConverter Class**: Core conversion logic that transforms HTML elements to Markdown syntax

### Content Extraction Strategy
The extension follows a hierarchical content detection approach:
1. `<article>` tag (highest priority)
2. `<main>` tag
3. Elements with `role="main"`
4. Common content selectors (`.content`, `.article`, `.post`, `#content`, `#main`)
5. `<body>` tag (fallback)

### Build System
- **TypeScript**: Compiles `src/` to `dist/` with strict type checking
- **Chrome Types**: Uses `@types/chrome` for extension API typing
- **Asset Pipeline**: Copies HTML/CSS files during build
- **ZIP Packaging**: Creates versioned extension packages

### Testing Strategy
Uses **in-source testing** with Vitest:
- Tests are written in `if (import.meta.vitest)` blocks within source files
- Chrome APIs are mocked for testing environment
- DOM manipulation is tested using jsdom
- 27 tests covering MarkdownConverter and popup functionality

### Code Quality Tools
- **oxlint**: Fast JavaScript/TypeScript linter
- **Prettier**: Code formatter with specific configuration for this project
- **TypeScript**: Strict type checking with Chrome extension types

### CI/CD Pipeline
GitHub Actions workflow runs on pull requests and main branch pushes:
- Parallel execution of typecheck, lint, format check, and tests
- Build verification with artifact upload
- Node.js 20 with npm caching

## Extension Manifest
- Manifest V3 with `activeTab`, `clipboardWrite`, and `scripting` permissions
- Popup references `dist/popup.html` (compiled output)
- Content script injection via `chrome.scripting.executeScript`

## Communication Flow
1. User clicks extension icon → popup opens
2. Popup injects content script via `chrome.scripting.executeScript`
3. Content script extracts and converts HTML to Markdown
4. Popup receives converted content via `chrome.tabs.sendMessage`
5. Popup copies to clipboard using Clipboard API with fallback to `document.execCommand`