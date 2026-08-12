# Inking Project Context

## Overview

Inking is a self-hosted LaTeX editor built as a Turborepo + pnpm monorepo. Users write LaTeX on the left pane and see a live PDF preview on the right, manage their documents (create, edit, search, archive, trash), and log in via Google/GitHub OAuth.

## Architecture

- Monorepo: Turborepo + pnpm workspaces, TypeScript throughout
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 in `apps/web`
- Backend: Hono 4 (ESM, via @hono/node-server) in `apps/server`
- Database: PostgreSQL with Prisma 7 (`@prisma/adapter-pg`) in `packages/database`
- LaTeX compilation: backend proxy to latexonline.cc

## Key Patterns

### Frontend Module Structure

Every feature follows this structure:

```
src/modules/<feature>/
├── components/     # UI components
├── hooks/          # React hooks (use-*.ts)
├── api/            # API client functions
└── page/           # Feature page wrapper components
```

Page files in `app/` are thin wrappers around these modules.

### Frontend Libraries

- Data fetching: @tanstack/react-query (`useDocument`, `useCreateDocument`, `useCompile`, `useLogout`)
- Forms: react-hook-form (`useForm` + `useWatch`)
- Editor: CodeMirror 6 (@codemirror/*) with a custom dark theme in `src/modules/editor/theme`
- PDF preview: pdfjs-dist rendered to canvases in `PdfViewer`
- Icons: react-icons (Feather)

### Styling Rules

- Tailwind CSS only, no CSS modules
- Dark theme with black (#000) backgrounds
- Accent color: #0052EA (compile button, active states)
- Editor chrome: #1E1E1E editor bg, #252526 top bar
- Compact UI: text-xs / text-[13px] / text-[11px] labels
- Pills/buttons: rounded-full on landing, rounded-[5px] in editor
- Font: Urbanist (--font-questrial variable) from next/font/google

### Backend Patterns

- Modular route structure under `apps/server/src/modules`
- Service layer for business logic (e.g., `compile.service.ts`)
- Zod-validated environment config (`config/env.ts`)
- ESM modules (`import ... from '...js'`)
- Auth: arctic (Google/GitHub OAuth with PKCE) + jose (JWT access + rotating refresh in httpOnly cookies)
- Unit tests with Jest (`jest --runInBand`)

### Shared Config

- `apps/server/.env`: NODE_ENV, API_URL, FRONTEND_URL, ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, LATEX_ONLINE_URL
- `packages/database/.env`: DATABASE_URL, DATABASE_POOL_SIZE
- `apps/web`: NEXT_PUBLIC_API_URL (frontend API base)

## Commands

```bash
pnpm dev                  # Start all apps in dev mode
pnpm build                # Build all apps and packages
pnpm lint                 # Lint all apps and packages
pnpm format               # Format code with Prettier
pnpm check-types          # Type-check all apps and packages
pnpm --filter web dev     # Frontend only
pnpm --filter hono dev    # Backend only
pnpm --filter hono test   # Run backend tests (Jest)
pnpm --filter database generate   # Generate Prisma client
pnpm --filter database db:push    # Push schema to the database
```

## Gotchas

- `packages/database` runs `prisma generate` inside its `build` step; it must not require DATABASE_URL at install time
- Husky pre-commit hook runs only `pnpm --filter hono test`
- Commit messages must pass commitlint (header keeps to conventional `type: description`)