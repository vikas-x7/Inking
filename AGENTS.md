# AGENTS.md

Guide for AI coding agents working on this repository.

## Project Overview

Inking is a self-hosted LaTeX editor (write, compile, preview documents in the browser). Turborepo monorepo with a Next.js frontend and a Hono backend, PostgreSQL via Prisma.

## Repository Structure

```
ining/
├── apps/
│   ├── web/           # Next.js 16 frontend (App Router), React 19, Tailwind 4
│   └── server/        # Hono 4 backend (ESM)
├── packages/
│   └── database/      # Prisma 7 schema (@prisma/adapter-pg)
├── .github/           # GitHub templates
├── .agents/           # AI coding agent skills
└── turbo.json         # Turborepo config
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TanStack Query, react-hook-form, CodeMirror 6, pdfjs-dist
- **Backend**: Hono 4 (@hono/node-server), Prisma 7, arctic (OAuth), jose (JWT)
- **Database**: PostgreSQL 16
- **Package Manager**: pnpm (workspaces)
- **Language**: TypeScript 5 throughout
- **Testing**: Jest (backend unit tests)

## Key Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `TopBar.tsx`, `PdfViewer.tsx`)
- Hooks: `use-*.ts` (e.g., `use-auth.ts`)
- API files: `api/index.ts` or `api.ts` exporting an API object
- Backend files: `kebab-case.ts` (e.g., `compile.service.ts`), `camelCase.ts` for providers

### Module Pattern (Frontend)

Each feature lives in `apps/web/src/modules/<feature>/`:

```
modules/
├── auth/        # api/, hooks/, page/
├── documents/   # api/, hooks/
├── compile/     # api/, hooks/
├── editor/      # page/, components/, theme/
├── landing/     # page/, components/
└── users/       # api/
```

Page files in `app/` are thin wrappers that import from modules (`app/auth`, `app/editor`, root `page.tsx`).

### Component Style

- Use `'use client'` directive for client components
- Tailwind only, no CSS modules or styled-components
- Dark theme with black backgrounds
- Accent color: `#0052EA` (compile button, active states)
- Editor chrome: `#1E1E1E` editor bg, `#252526` top bar
- Compact labels: `text-xs` / `text-[13px]`
- Rounded: `rounded-full` on landing, `rounded-[5px]` in editor

### API Pattern (Backend)

- Modules in `apps/server/src/modules/<feature>/`
- Services handle business logic (e.g., `compile.service.ts`)
- Zod-validated env config in `src/config/env.ts`
- Auth guards in `modules/auth/guards`
- ESM modules (`import ... from '...js'`)

### Git Conventions

- Commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Commitlint enforces conventional commits (header max length 200)
- Husky pre-commit hook runs `pnpm --filter hono test`

### LaTeX Compile Flow

- Editor sends content via `useCompile` → backend proxy to latexonline.cc → PDF blob → pdfjs-dist renders it in the preview pane

## Common Tasks

### Adding a new page

1. Create module in `apps/web/src/modules/<name>/`
2. Add components, hooks, API files as needed
3. Create thin `page.tsx` in `apps/web/app/<name>/`

### Adding an API endpoint

1. Add route/service in `apps/server/src/modules/<feature>/`
2. Add Prisma schema changes if needed
3. Run `pnpm --filter database db:migrate`

### Running Development

```bash
pnpm dev                          # Start all apps
pnpm build                        # Build all
pnpm lint                         # Lint all
pnpm check-types                  # Type-check all
pnpm --filter web dev             # Frontend only
pnpm --filter hono dev            # Backend only
pnpm --filter hono test           # Backend unit tests
pnpm --filter database generate   # Generate Prisma client
pnpm --filter database db:push    # Push schema to the database
```

## Environment Variables

- Frontend: `NEXT_PUBLIC_API_URL` (API base URL)
- Backend: See `apps/server/.env.example` (NODE_ENV, API_URL, FRONTEND_URL, ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, LATEX_ONLINE_URL)
- Database: See `packages/database/.env.example` (DATABASE_URL, DATABASE_POOL_SIZE)

## Important Notes

- Never commit `.env` files
- Frontend and backend run on separate ports (3000 and 3001)
- LaTeX compilation depends on the third-party latexonline.cc service
- `packages/database` runs `prisma generate` inside its `build` step; it must not require DATABASE_URL at install time