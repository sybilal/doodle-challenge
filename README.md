# Doodle Chat Challenge

A small real-time chat application built with React, TypeScript and Vite. It renders a
virtualized message history, polls for new messages, supports sending, and lazily loads
older messages as you scroll up — with accessibility and testing treated as first-class
concerns.

## Features

- **Live updates** — polls for new messages every 2s (pauses while the tab is hidden).
- **Send messages** — optimistic-free POST with cache reconciliation on success.
- **Infinite history** — older messages load automatically as you scroll toward the top,
  with scroll position preserved across prepends.
- **Virtualized list** — only visible rows are rendered, so long histories stay smooth.
- **Resilient UX** — loading and error states, plus a manual retry for failed loads.
- **Accessible** — landmarks, labelled controls, live-region announcements, visible focus,
  sufficient contrast, and reduced-motion support.

## Tech Stack

| Concern            | Choice                                   |
| ------------------ | ---------------------------------------- |
| UI                 | React 19 + TypeScript                    |
| Build / dev server | Vite 8                                   |
| Server state       | TanStack Query (React Query)             |
| List virtualization| TanStack Virtual                         |
| HTTP               | Axios (with request/response interceptors)|
| Dates              | date-fns                                 |
| Testing            | Vitest + React Testing Library           |
| Linting            | ESLint (typescript-eslint, react-hooks)  |

## Architecture

<img width="842" height="511" alt="Doodle drawio" src="https://github.com/user-attachments/assets/cec56bb8-07d4-46fa-b6e0-be9581b18f2a" />

**Data flow at a glance:**

- `services/messages.service.ts` wraps the REST endpoints; `utils/interceptor.ts` centralizes
  the base URL, auth header, response unwrapping, and error normalization.
- TanStack Query holds the message list under a single cache key (`['messages']`). Three hooks
  read/write that cache:
  - `useMessages` — initial page load.
  - `usePollMessages` — periodic delta fetch (messages `after` the newest one).
  - `useOlderMessages` — paginated history (messages `before` the oldest one).
  - `useSendMessage` — POST, then merge the created message into the cache.
- `utils/merge-messages.ts` deduplicates by id and keeps the list sorted, so every writer can
  merge safely regardless of order.
- `components/Conversation` owns the virtualizer and scroll orchestration; presentational
  pieces (`Message`, `Footer`, `LoadingBar`, `ErrorBar`, `NewMessagePill`) stay stateless.

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- A running backend exposing the chat API (see environment variables below)

### Environment

Create a `.env` file in the project root:

```bash
VITE_BASE_URL=http://localhost:3000/api/v1
VITE_TOKEN=your-api-token
```

### Install & run

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
```

## Available Scripts

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                    |
| `npm run build`         | Type-check and build for production          |
| `npm run preview`       | Preview the production build                 |
| `npm run lint`          | Run ESLint                                   |
| `npm test`              | Run unit/component tests in watch mode       |
| `npm run test:run`      | Run the test suite once (CI mode)            |
| `npm run test:coverage` | Run the suite with a coverage report         |

## Testing

Tests follow a layered strategy, kept fast and deterministic:

- **Unit** — pure logic (`merge-messages`, `decode-html`, interceptor error mapping).
- **Hooks** — data hooks against a mocked service and QueryClient, including polling driven
  by fake timers.
- **Components** — rendered and asserted through the accessibility tree (roles/labels), so the
  tests double as accessibility regression coverage.

The scroll/virtualization behavior in `Conversation` is deliberately validated at the
component level for its branching/markup only; its layout-dependent scrolling is left to a
future end-to-end (browser) layer, since jsdom cannot measure real scroll geometry.

```bash
npm run test:run        # run everything once
npm run test:coverage   # with coverage
```

## Accessibility

- `main` landmark and off-screen page heading
- Labelled message input and clearly-named buttons
- `aria-live` regions announcing new messages, loading, and errors
- Message list exposed as a list with per-message labels ("You" vs. author + time)
- Visible keyboard focus indicators and `prefers-reduced-motion` handling

## Continuous Integration

`.github/workflows/ci.yml` runs lint, tests, and a production build on every push and pull
request to `main`.

## Project Structure

```
src/
├── components/     # Presentational + Conversation (virtualized list)
├── hooks/          # useMessages, usePollMessages, useOlderMessages, useSendMessage
├── services/       # REST endpoint wrappers
├── utils/          # interceptor, query client, merge/sort, html decode, constants
├── models/         # Shared TypeScript interfaces
├── pages/Chat/     # Page composition
└── test/           # Test setup and shared helpers
```
